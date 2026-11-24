// Micrófono en vivo: escucha el mar, corta el audio en ventanas de 1 segundo y se las pasa al modelo.
// Igual que la web: 16 000 muestras por ventana y 50 % de solapamiento (una ventana cada medio segundo).
import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream, type AudioStreamBuffer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useClassifier } from '../context/ClassifierContext';
import { floatToInt16Base64, resample, rmsLevel } from '../lib/pcm';
import type { ClassificationOutput } from '../lib/species';
import { setPlaybackAudioMode, speak, stopSpeaking } from '../lib/voice';
import { useDetectionHandler } from './useDetectionHandler';

const RATE = 16000;
const WINDOW = 16000;
const HOP = 8000;
const CAPACITY = WINDOW * 3;
const KEEP_AWAKE_TAG = 'faro-escucha';

export type ListenerState = 'idle' | 'starting' | 'listening' | 'speaking';

export function useLiveListener() {
  const { classifyPcm, status: modelStatus } = useClassifier();
  const { handle } = useDetectionHandler();

  const [state, setState] = useState<ListenerState>('idle');
  const [level, setLevel] = useState(0);
  const [lastHeard, setLastHeard] = useState<ClassificationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = useRef(false);
  const paused = useRef(false);
  const busy = useRef(false);
  const acc = useRef(new Float32Array(CAPACITY));
  const accLen = useRef(0);
  const lastLevelAt = useRef(0);
  const handleRef = useRef(handle);
  handleRef.current = handle;
  const classifyRef = useRef(classifyPcm);
  classifyRef.current = classifyPcm;

  // useAudioStream guarda esta función en una ref, así que puede cambiar en cada render sin problema.
  const onBuffer = (buffer: AudioStreamBuffer) => {
    if (!active.current || paused.current) return;

    let samples: Float32Array = new Float32Array(buffer.data);
    if (buffer.channels > 1) {
      const mono = new Float32Array(Math.floor(samples.length / buffer.channels));
      for (let i = 0; i < mono.length; i++) mono[i] = samples[i * buffer.channels];
      samples = mono;
    }
    if (buffer.sampleRate !== RATE) samples = resample(samples, buffer.sampleRate, RATE);

    // Nivel de sonido para el radar, como máximo 10 veces por segundo.
    const now = Date.now();
    if (now - lastLevelAt.current > 100) {
      lastLevelAt.current = now;
      setLevel(rmsLevel(samples));
    }

    // Acumula audio. Si el modelo va lento, se descarta lo más viejo para no atrasarse.
    const store = acc.current;
    if (accLen.current + samples.length > CAPACITY) {
      const drop = accLen.current + samples.length - CAPACITY;
      store.copyWithin(0, drop, accLen.current);
      accLen.current -= drop;
    }
    store.set(samples, accLen.current);
    accLen.current += samples.length;

    if (accLen.current >= WINDOW && !busy.current) {
      const chunk = store.slice(0, WINDOW);
      store.copyWithin(0, HOP, accLen.current);
      accLen.current -= HOP;
      void classifyWindow(chunk);
    }
  };

  const { stream } = useAudioStream({ sampleRate: RATE, channels: 1, encoding: 'float32', onBuffer });
  const streamRef = useRef(stream);
  streamRef.current = stream;

  const startStream = useCallback(async () => {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await streamRef.current.start();
  }, []);

  // Mientras habla la Voz del Faro, el micrófono se pausa: iOS no deja grabar y hablar por el parlante a la vez.
  const speakPaused = useCallback(
    async (text: string) => {
      paused.current = true;
      streamRef.current.stop();
      setState('speaking');
      setLevel(0);
      try {
        await speak(text);
      } finally {
        accLen.current = 0;
        if (active.current) {
          try {
            await startStream();
            setState('listening');
          } catch {
            setError('No se pudo reanudar el micrófono.');
            active.current = false;
            setState('idle');
          }
        }
        paused.current = false;
      }
    },
    [startStream],
  );
  const speakPausedRef = useRef(speakPaused);
  speakPausedRef.current = speakPaused;

  async function classifyWindow(chunk: Float32Array) {
    busy.current = true;
    try {
      const result = await classifyRef.current(floatToInt16Base64(chunk));
      if (!active.current) return;
      setLastHeard(result);
      const say = handleRef.current(result, 'Micrófono en Vivo', 'live_mic');
      if (say) await speakPausedRef.current(say);
    } catch {
      // Una ventana perdida no detiene la escucha; la siguiente llega en medio segundo.
    } finally {
      busy.current = false;
    }
  }

  const start = useCallback(async () => {
    if (active.current) return;
    setError(null);
    if (modelStatus !== 'ready') {
      setError('El modelo todavía está cargando. Espere unos segundos.');
      return;
    }
    setState('starting');
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Sin permiso de micrófono. Actívelo en Ajustes › Expo Go › Micrófono.');
        setState('idle');
        return;
      }
      stopSpeaking();
      accLen.current = 0;
      active.current = true;
      paused.current = false;
      await startStream();
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
      setState('listening');
    } catch (e) {
      active.current = false;
      setError(`No se pudo abrir el micrófono: ${e instanceof Error ? e.message : String(e)}`);
      setState('idle');
    }
  }, [modelStatus, startStream]);

  const stop = useCallback(() => {
    active.current = false;
    paused.current = false;
    accLen.current = 0;
    try {
      streamRef.current.stop();
    } catch {
      // Ya estaba detenido.
    }
    stopSpeaking();
    void deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    void setPlaybackAudioMode().catch(() => undefined);
    setLevel(0);
    setState('idle');
  }, []);

  // Lee un texto en voz alta. Si el micrófono está abierto, lo pausa mientras habla.
  const announce = useCallback(
    async (text: string) => {
      if (active.current && !paused.current) await speakPaused(text);
      else await speak(text);
    },
    [speakPaused],
  );

  // Al salir de la pantalla, se apaga el micrófono.
  useEffect(() => () => stop(), [stop]);

  return { state, level, lastHeard, error, start, stop, announce, isActive: state !== 'idle' };
}
