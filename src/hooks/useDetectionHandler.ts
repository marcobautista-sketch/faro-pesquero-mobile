// Qué pasa cuando el modelo reconoce un sonido: mostrarlo, vibrar, hablar y anotarlo en la bitácora.
import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';

import { useAppStore } from '../context/AppStore';
import { describePlace, useLocation } from '../context/LocationContext';
import type { DetectionSource } from '../lib/data';
import { ALERT_THRESHOLD, SAVE_THRESHOLD, type ClassificationOutput } from '../lib/species';
import { speak } from '../lib/voice';

// En vivo, la misma ave no se vuelve a anunciar ni a guardar hasta pasados 10 segundos.
const LIVE_COOLDOWN_MS = 10_000;

export function voiceText(result: ClassificationOutput): string {
  return `¡${result.commonName} detectado al ${Math.round(result.confidence * 100)} por ciento! ${result.fishIndication} ${result.advice}`;
}

export function useDetectionHandler() {
  const { user, addDetection, showDetection } = useAppStore();
  const location = useLocation();
  const lastAlert = useRef<{ species: string; at: number } | null>(null);
  const prefs = user.preferences;

  // Devuelve el texto a leer en voz alta (o null si no corresponde hablar).
  const handle = useCallback(
    (result: ClassificationOutput, soundName: string, source: DetectionSource): string | null => {
      const isBird = result.species !== 'Ruido_Fondo';

      if (source === 'live_mic') {
        const now = Date.now();
        const confident = isBird && result.confidence >= ALERT_THRESHOLD;
        const repeated =
          lastAlert.current?.species === result.species && now - lastAlert.current.at < LIVE_COOLDOWN_MS;
        // En vivo solo se cambia la tarjeta cuando hay un ave nueva, para que no parpadee con el ruido.
        if (!confident || repeated) return null;
        lastAlert.current = { species: result.species, at: now };
      }

      showDetection(result, soundName);

      if (prefs.vibrationFeedback) {
        if (!isBird) void Haptics.selectionAsync();
        else if (result.urgency === 'alta') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (prefs.autoSaveDetections && isBird && result.confidence >= SAVE_THRESHOLD) {
        addDetection({
          species: result.species,
          commonName: result.commonName,
          scientificName: result.scientificName,
          confidence: result.confidence,
          location: describePlace(location),
          coordinates: { lat: location.origin.lat, lng: location.origin.lng },
          usedRealGps: location.usingRealGps,
          advice: result.advice,
          fishIndication: result.fishIndication,
          source,
        });
      }

      return prefs.voiceAlerts ? voiceText(result) : null;
    },
    [addDetection, location, prefs.autoSaveDetections, prefs.vibrationFeedback, prefs.voiceAlerts, showDetection],
  );

  return { handle, speak };
}
