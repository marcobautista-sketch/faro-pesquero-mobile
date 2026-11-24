// GPS compartido por toda la app: posición, velocidad y precisión.
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { FISHING_SPOTS, PIER, type FishingSpot } from '../lib/data';
import { distanceKm, type LatLng } from '../lib/geo';

export type LocationStatus = 'pending' | 'granted' | 'denied' | 'error';

export interface Fix extends LatLng {
  accuracy: number | null;
  speedMs: number | null;
  altitude: number | null;
  timestamp: number;
}

interface LocationValue {
  status: LocationStatus;
  fix: Fix | null;
  // Posición para calcular rumbos: GPS real o, si no hay, el muelle de Chorrillos.
  origin: LatLng;
  usingRealGps: boolean;
  nearestSpot: { spot: FishingSpot; km: number } | null;
  retry: () => void;
}

const LocationContext = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('pending');
  const [fix, setFix] = useState<Fix | null>(null);
  const [attempt, setAttempt] = useState(0);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm.status !== 'granted') {
          setStatus('denied');
          return;
        }
        setStatus('granted');
        subscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
          (loc) => {
            setFix({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
              speedMs: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : null,
              altitude: loc.coords.altitude,
              timestamp: loc.timestamp,
            });
          },
        );
        if (cancelled) subscription.current.remove();
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo<LocationValue>(() => {
    const origin: LatLng = fix ?? PIER;
    let nearest: { spot: FishingSpot; km: number } | null = null;
    for (const spot of FISHING_SPOTS) {
      const km = distanceKm(origin, spot);
      if (!nearest || km < nearest.km) nearest = { spot, km };
    }
    return { status, fix, origin, usingRealGps: fix !== null, nearestSpot: nearest, retry };
  }, [status, fix, retry]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation debe usarse dentro de LocationProvider');
  return ctx;
}

// Nombre del lugar para la bitácora: la zona de pesca si estás cerca, si no "Altamar".
export function describePlace(value: Pick<LocationValue, 'nearestSpot' | 'usingRealGps'>): string {
  if (!value.nearestSpot) return 'Altamar - Muelle de Chorrillos';
  if (!value.usingRealGps) return value.nearestSpot.spot.name;
  if (value.nearestSpot.km <= 1.5) return value.nearestSpot.spot.name;
  return `Altamar · a ${value.nearestSpot.km.toFixed(1)} km de ${value.nearestSpot.spot.name}`;
}
