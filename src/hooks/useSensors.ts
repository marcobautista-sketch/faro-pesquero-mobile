// Sensores del celular convertidos en información útil para el pescador.
import * as Location from 'expo-location';
import { Barometer, DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Estado del mar: acelerómetro + giroscopio (DeviceMotion).
// Mide cuánto se balancea el bote. En la demo, mover el celular simula el oleaje.
// ---------------------------------------------------------------------------

export type SeaLevel = 'calmo' | 'moderado' | 'fuerte';

export interface SeaState {
  available: boolean | null;
  rollDeg: number; // inclinación a babor/estribor (izquierda/derecha)
  pitchDeg: number; // inclinación de proa a popa (adelante/atrás)
  swingDeg: number; // balanceo máximo en los últimos 4 segundos
  shake: number; // sacudida (m/s²) promedio en los últimos 4 segundos
  level: SeaLevel;
}

const WINDOW_MS = 4000;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function classifySea(swingDeg: number, shake: number): SeaLevel {
  if (swingDeg >= 25 || shake >= 2.5) return 'fuerte';
  if (swingDeg >= 10 || shake >= 0.8) return 'moderado';
  return 'calmo';
}

export function useSeaState(enabled: boolean): SeaState {
  const [state, setState] = useState<SeaState>({
    available: null,
    rollDeg: 0,
    pitchDeg: 0,
    swingDeg: 0,
    shake: 0,
    level: 'calmo',
  });
  const history = useRef<{ t: number; roll: number; pitch: number; acc: number }[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const available = await DeviceMotion.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setState((s) => ({ ...s, available: false }));
        return;
      }
      DeviceMotion.setUpdateInterval(100);
      sub = DeviceMotion.addListener((m) => {
        const now = Date.now();
        const roll = toDeg(m.rotation?.gamma ?? 0);
        const pitch = toDeg(m.rotation?.beta ?? 0);
        const a = m.acceleration;
        const acc = a ? Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2) : 0;

        const h = history.current;
        h.push({ t: now, roll, pitch, acc });
        while (h.length && now - h[0].t > WINDOW_MS) h.shift();

        let minRoll = Infinity;
        let maxRoll = -Infinity;
        let minPitch = Infinity;
        let maxPitch = -Infinity;
        let accSum = 0;
        for (const p of h) {
          minRoll = Math.min(minRoll, p.roll);
          maxRoll = Math.max(maxRoll, p.roll);
          minPitch = Math.min(minPitch, p.pitch);
          maxPitch = Math.max(maxPitch, p.pitch);
          accSum += p.acc;
        }
        const swingDeg = Math.max(maxRoll - minRoll, maxPitch - minPitch);
        const shake = accSum / h.length;
        setState({ available: true, rollDeg: roll, pitchDeg: pitch, swingDeg, shake, level: classifySea(swingDeg, shake) });
      });
    })();
    return () => {
      cancelled = true;
      sub?.remove();
      history.current = [];
    };
  }, [enabled]);

  return state;
}

// ---------------------------------------------------------------------------
// Barómetro: presión del aire. Si baja rápido, se acerca mal tiempo.
// ---------------------------------------------------------------------------

export type PressureTrend = 'subiendo' | 'estable' | 'bajando' | 'midiendo';

export interface PressureState {
  available: boolean | null;
  hPa: number | null;
  relativeAltitude: number | null;
  history: number[]; // una lectura cada 5 segundos, la más reciente al final
  changeHPa: number; // cambio desde la primera lectura guardada
  trend: PressureTrend;
}

const SAMPLE_EVERY_MS = 5000;
const MAX_POINTS = 36; // 3 minutos de historia en la pantalla

export function pressureTrend(change: number, points: number): PressureTrend {
  if (points < 3) return 'midiendo';
  if (change <= -0.3) return 'bajando';
  if (change >= 0.3) return 'subiendo';
  return 'estable';
}

export function useBarometer(enabled: boolean): PressureState {
  const [state, setState] = useState<PressureState>({
    available: null,
    hPa: null,
    relativeAltitude: null,
    history: [],
    changeHPa: 0,
    trend: 'midiendo',
  });
  const lastSampleAt = useRef(0);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const available = await Barometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setState((s) => ({ ...s, available: false }));
        return;
      }
      Barometer.setUpdateInterval(1000);
      sub = Barometer.addListener(({ pressure, relativeAltitude }) => {
        const now = Date.now();
        if (now - lastSampleAt.current >= SAMPLE_EVERY_MS || historyRef.current.length === 0) {
          lastSampleAt.current = now;
          historyRef.current = [...historyRef.current, pressure].slice(-MAX_POINTS);
        }
        const h = historyRef.current;
        const change = h.length ? pressure - h[0] : 0;
        setState({
          available: true,
          hPa: pressure,
          relativeAltitude: relativeAltitude ?? null,
          history: h,
          changeHPa: change,
          trend: pressureTrend(change, h.length),
        });
      });
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return state;
}

// ---------------------------------------------------------------------------
// Brújula: magnetómetro calibrado por iOS (rumbo respecto al norte).
// ---------------------------------------------------------------------------

export interface HeadingState {
  heading: number | null; // 0° = norte
  accuracy: number | null;
  error: string | null;
}

export function useHeading(enabled: boolean): HeadingState {
  const [state, setState] = useState<HeadingState>({ heading: null, accuracy: null, error: null });

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) {
          const asked = await Location.requestForegroundPermissionsAsync();
          if (!asked.granted) {
            if (!cancelled) setState((s) => ({ ...s, error: 'Sin permiso de ubicación: la brújula necesita ese permiso en iPhone.' }));
            return;
          }
        }
        sub = await Location.watchHeadingAsync((h) => {
          const heading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          setState({ heading, accuracy: h.accuracy, error: null });
        });
        if (cancelled) sub.remove();
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return state;
}
