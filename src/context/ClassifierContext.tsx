// Corre el modelo de Edge Impulse dentro del celular, sin internet.
//
// Expo Go usa el motor Hermes, que no ejecuta WebAssembly. Por eso el modelo vive en un WebView
// invisible (el motor de Safari, que sí lo ejecuta). La app le manda 1 segundo de audio y el
// WebView responde con la probabilidad de cada ave, como un intérprete que traduce en voz baja.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ComponentType, type ReactNode, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { EI_HTML } from '../model/generated/eiHtml';
import { buildClassification, type ClassificationOutput, type ClassificationResult } from '../lib/species';

export type ClassifierStatus = 'loading' | 'ready' | 'error';

interface ProjectInfo {
  id: number;
  name: string;
  owner: string;
  deploy_version: number;
}

interface ClassifierValue {
  status: ClassifierStatus;
  error: string | null;
  project: ProjectInfo | null;
  // Recibe audio Int16 a 16 kHz en base64 (1 segundo = 16 000 muestras).
  classifyPcm: (pcmBase64: string) => Promise<ClassificationOutput>;
}

type BridgeMessage =
  | { type: 'ready'; project: ProjectInfo }
  | { type: 'error'; message: string }
  | { type: 'result'; id: number; results?: ClassificationResult[]; ms?: number; error?: string };

interface Pending {
  resolve: (value: ClassificationOutput) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// Solo las partes del WebView que usamos. Con TypeScript 6 los tipos de react-native-webview 14
// se reducen a "never", así que se declaran aquí a mano.
interface BridgeHandle {
  injectJavaScript: (script: string) => void;
  reload: () => void;
}
interface BridgeProps {
  ref?: Ref<BridgeHandle>;
  source: { html: string };
  originWhitelist: string[];
  javaScriptEnabled: boolean;
  onMessage: (event: WebViewMessageEvent) => void;
  onContentProcessDidTerminate?: () => void;
  onRenderProcessGone?: () => void;
  onError?: (event: { nativeEvent: { description: string } }) => void;
}
const BridgeWebView = WebView as unknown as ComponentType<BridgeProps>;

// Fuera del componente para que el HTML de 10 MB no se vuelva a enviar en cada render.
const SOURCE = { html: EI_HTML };
const TIMEOUT_MS = 8000;

const ClassifierContext = createContext<ClassifierValue | null>(null);

export function ClassifierProvider({ children }: { children: ReactNode }) {
  const webviewRef = useRef<BridgeHandle>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(1);
  const [status, setStatus] = useState<ClassifierStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);

  const failAll = useCallback((reason: string) => {
    for (const [id, p] of pending.current) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
      pending.current.delete(id);
    }
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let msg: BridgeMessage;
      try {
        msg = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        setProject(msg.project);
        setError(null);
        setStatus('ready');
      } else if (msg.type === 'error') {
        setError(msg.message);
        setStatus((prev) => (prev === 'ready' ? prev : 'error'));
      } else if (msg.type === 'result') {
        const p = pending.current.get(msg.id);
        if (!p) return;
        clearTimeout(p.timer);
        pending.current.delete(msg.id);
        if (msg.error || !msg.results) p.reject(new Error(msg.error ?? 'Respuesta vacía del modelo'));
        else p.resolve(buildClassification(msg.results, msg.ms ?? 0));
      }
    },
    [],
  );

  const classifyPcm = useCallback(
    (pcmBase64: string) =>
      new Promise<ClassificationOutput>((resolve, reject) => {
        const webview = webviewRef.current;
        if (status !== 'ready' || !webview) {
          reject(new Error('El modelo todavía está cargando'));
          return;
        }
        const id = nextId.current++;
        const timer = setTimeout(() => {
          pending.current.delete(id);
          reject(new Error('El modelo tardó demasiado en responder'));
        }, TIMEOUT_MS);
        pending.current.set(id, { resolve, reject, timer });
        // El base64 solo usa letras, números, "+", "/" y "=": es seguro dentro de comillas.
        webview.injectJavaScript(`window.__classify(${id}, "${pcmBase64}"); true;`);
      }),
    [status],
  );

  // Si iOS cierra el WebView por memoria, se recarga el modelo.
  const onTerminate = useCallback(() => {
    failAll('El modelo se reinició');
    setStatus('loading');
    webviewRef.current?.reload();
  }, [failAll]);

  const value = useMemo(() => ({ status, error, project, classifyPcm }), [status, error, project, classifyPcm]);

  return (
    <ClassifierContext.Provider value={value}>
      {children}
      <View style={styles.hidden} pointerEvents="none">
        <BridgeWebView
          ref={webviewRef}
          source={SOURCE}
          originWhitelist={['*']}
          javaScriptEnabled
          onMessage={onMessage}
          onContentProcessDidTerminate={onTerminate}
          onRenderProcessGone={onTerminate}
          onError={(e) => {
            setError(e.nativeEvent.description);
            setStatus('error');
          }}
        />
      </View>
    </ClassifierContext.Provider>
  );
}

export function useClassifier(): ClassifierValue {
  const ctx = useContext(ClassifierContext);
  if (!ctx) throw new Error('useClassifier debe usarse dentro de ClassifierProvider');
  return ctx;
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 2,
    height: 2,
    left: 0,
    bottom: 0,
    opacity: 0,
  },
});
