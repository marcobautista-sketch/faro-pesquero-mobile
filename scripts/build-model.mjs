// Genera los módulos que llevan el modelo de Edge Impulse y los sonidos de prueba dentro de la app.
// Se ejecuta solo después de `npm install` (script "postinstall") o a mano con `npm run build:model`.
//
// Por qué existe: Expo Go usa el motor Hermes, que no ejecuta WebAssembly. El modelo sí corre dentro
// de un WebView (el mismo motor de Safari), así que empaquetamos todo en una página HTML autónoma.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eiDir = path.join(root, 'model', 'ei');
const audioDir = path.join(root, 'assets', 'audio');
const outDir = path.join(root, 'src', 'model', 'generated');

const HEADER = '// Archivo generado por scripts/build-model.mjs. No editar a mano.\n';

// Evita que un "</script>" dentro del código cierre la etiqueta antes de tiempo.
const inlineSafe = (code) => code.replace(/<\/script/gi, '<\\/script');

function buildHtml() {
  const wasmB64 = fs.readFileSync(path.join(eiDir, 'edge-impulse-standalone.wasm')).toString('base64');
  const glue = fs.readFileSync(path.join(eiDir, 'edge-impulse-standalone.js'), 'utf8');
  const runner = fs.readFileSync(path.join(eiDir, 'run-impulse.js'), 'utf8');

  const bridge = `
(function () {
  function post(msg) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch (e) {}
  }
  window.onerror = function (message) { post({ type: 'error', message: String(message) }); };

  var classifier = null;
  var originalInit = Module.onRuntimeInitialized;
  Module.onRuntimeInitialized = function () {
    try {
      if (originalInit) originalInit();
      var code = Module.init();
      if (typeof code === 'number' && code !== 0) throw new Error('init() fallo con codigo ' + code);
      classifier = new EdgeImpulseClassifier();
      var info = classifier.getProjectInfo();
      var props = classifier.getProperties();
      post({ type: 'ready', project: info, labels: props.labels, frequency: props.frequency });
    } catch (e) {
      post({ type: 'error', message: String(e && e.message ? e.message : e) });
    }
  };

  // Recibe 1 segundo de audio: muestras Int16 (16 kHz) codificadas en base64.
  window.__classify = function (id, b64) {
    if (!classifier) { post({ type: 'result', id: id, error: 'El modelo aun no esta listo' }); return; }
    try {
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
      var features = new Float32Array(16000);
      var n = Math.min(pcm.length, 16000);
      for (var j = 0; j < n; j++) features[j] = pcm[j];
      var t0 = performance.now();
      var raw = classifier.classify(features);
      post({ type: 'result', id: id, results: raw.results, ms: Math.round(performance.now() - t0) });
    } catch (e) {
      post({ type: 'result', id: id, error: String(e && e.message ? e.message : e) });
    }
  };
})();`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body>
<script>
var __wasmText = atob("${wasmB64}");
var __wasmBytes = new Uint8Array(__wasmText.length);
for (var __i = 0; __i < __wasmText.length; __i++) __wasmBytes[__i] = __wasmText.charCodeAt(__i);
__wasmText = null;
var Module = { wasmBinary: __wasmBytes };
</script>
<script>
${inlineSafe(runner)}
window.EdgeImpulseClassifier = EdgeImpulseClassifier;
</script>
<script>${inlineSafe(bridge)}</script>
<script>
${inlineSafe(glue)}
</script>
</body></html>`;
}

// Lee un WAV recorriendo sus bloques ("chunks") hasta encontrar "data".
function readWavPcm16(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${file} no es un WAV`);
  }
  let offset = 12;
  let format = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = {
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bits: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      if (!format || format.bits !== 16 || format.channels !== 1 || format.sampleRate !== 16000) {
        throw new Error(`${file}: se esperaba PCM 16 bits, mono, 16 kHz`);
      }
      return buf.subarray(body, body + size);
    }
    offset = body + size + (size % 2);
  }
  throw new Error(`${file}: no tiene bloque data`);
}

function buildSamples() {
  const ids = ['piquero', 'pelicano', 'gaviota', 'ruido_mar'];
  const entries = ids.map((id) => {
    const pcm = readWavPcm16(path.join(audioDir, `${id}.wav`));
    return `  ${id}: '${pcm.toString('base64')}',`;
  });
  return `${HEADER}// Audio de prueba: Int16, mono, 16 kHz, en base64.\nexport const SAMPLE_PCM_BASE64 = {\n${entries.join('\n')}\n} as const;\n`;
}

fs.mkdirSync(outDir, { recursive: true });
const html = buildHtml();
fs.writeFileSync(path.join(outDir, 'eiHtml.ts'), `${HEADER}export const EI_HTML: string = ${JSON.stringify(html)};\n`);
fs.writeFileSync(path.join(outDir, 'samplePcm.ts'), buildSamples());
console.log(`Modelo empaquetado: ${(html.length / 1024 / 1024).toFixed(1)} MB de HTML en src/model/generated/`);
