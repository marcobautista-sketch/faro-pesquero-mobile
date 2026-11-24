// Estado global de la app: perfil, preferencias, bitácora y la última detección.
// Se guarda en el celular con AsyncStorage, así que funciona sin internet y sin servidor.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_USER, seedDetections, type DetectionRecord, type Preferences, type UserProfile } from '../lib/data';
import type { ClassificationOutput } from '../lib/species';
import { makeTheme, type Theme } from '../lib/theme';

const USER_KEY = 'faro:user:v1';
const DETECTIONS_KEY = 'faro:detections:v1';
const MAX_DETECTIONS = 200;

export interface ActiveDetection {
  result: ClassificationOutput;
  soundName: string;
  at: number;
}

interface AppStoreValue {
  loaded: boolean;
  user: UserProfile;
  detections: DetectionRecord[];
  active: ActiveDetection | null;
  theme: Theme;
  updateUser: (changes: Partial<Omit<UserProfile, 'preferences'>>) => void;
  updatePreferences: (changes: Partial<Preferences>) => void;
  addDetection: (record: Omit<DetectionRecord, 'id' | 'timestamp'>) => DetectionRecord;
  clearDetections: () => void;
  resetDemo: () => void;
  showDetection: (result: ClassificationOutput, soundName: string) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [active, setActive] = useState<ActiveDetection | null>(null);

  // Carga inicial: lo guardado en el celular o los datos de ejemplo.
  useEffect(() => {
    (async () => {
      try {
        const [rawUser, rawDetections] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(DETECTIONS_KEY),
        ]);
        if (rawUser) {
          const saved = JSON.parse(rawUser) as UserProfile;
          setUser({ ...DEFAULT_USER, ...saved, preferences: { ...DEFAULT_USER.preferences, ...saved.preferences } });
        }
        setDetections(rawDetections ? (JSON.parse(rawDetections) as DetectionRecord[]) : seedDetections());
      } catch {
        setDetections(seedDetections());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Guarda cada cambio (solo después de la carga inicial, para no pisar lo guardado).
  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => undefined);
  }, [user, loaded]);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(DETECTIONS_KEY, JSON.stringify(detections)).catch(() => undefined);
  }, [detections, loaded]);

  const updateUser = useCallback((changes: Partial<Omit<UserProfile, 'preferences'>>) => {
    setUser((prev) => ({ ...prev, ...changes }));
  }, []);

  const updatePreferences = useCallback((changes: Partial<Preferences>) => {
    setUser((prev) => ({ ...prev, preferences: { ...prev.preferences, ...changes } }));
  }, []);

  const addDetection = useCallback((record: Omit<DetectionRecord, 'id' | 'timestamp'>) => {
    const full: DetectionRecord = {
      ...record,
      id: `det-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setDetections((prev) => [full, ...prev].slice(0, MAX_DETECTIONS));
    return full;
  }, []);

  const clearDetections = useCallback(() => setDetections([]), []);

  const resetDemo = useCallback(() => {
    setUser(DEFAULT_USER);
    setDetections(seedDetections());
    setActive(null);
  }, []);

  const showDetection = useCallback((result: ClassificationOutput, soundName: string) => {
    setActive({ result, soundName, at: Date.now() });
  }, []);

  const theme = useMemo(
    () => makeTheme(user.preferences.highContrastMode, user.preferences.largeFont),
    [user.preferences.highContrastMode, user.preferences.largeFont],
  );

  const value = useMemo<AppStoreValue>(
    () => ({
      loaded,
      user,
      detections,
      active,
      theme,
      updateUser,
      updatePreferences,
      addDetection,
      clearDetections,
      resetDemo,
      showDetection,
    }),
    [loaded, user, detections, active, theme, updateUser, updatePreferences, addDetection, clearDetections, resetDemo, showDetection],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore debe usarse dentro de AppStoreProvider');
  return ctx;
}

export function useTheme(): Theme {
  return useAppStore().theme;
}
