// "Voz del Faro": lee los consejos en voz alta en español.
import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';

let voiceId: string | undefined;
let voiceLookupDone = false;

// iPhone no trae voz "es-PE"; se elige la voz en español latino más cercana.
async function pickSpanishVoice(): Promise<string | undefined> {
  if (voiceLookupDone) return voiceId;
  voiceLookupDone = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const order = ['es-PE', 'es-419', 'es-MX', 'es-US', 'es-CO', 'es-ES'];
    for (const lang of order) {
      const match = voices.find((v) => v.language?.replace('_', '-') === lang);
      if (match) {
        voiceId = match.identifier;
        break;
      }
    }
    if (!voiceId) voiceId = voices.find((v) => v.language?.startsWith('es'))?.identifier;
  } catch {
    voiceId = undefined;
  }
  return voiceId;
}

// Deja el audio en modo reproducción: suena aunque el iPhone esté en silencio.
export async function setPlaybackAudioMode(): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
}

// Habla y espera a que termine. Nunca se queda colgada: corta a los 25 segundos.
export async function speak(text: string): Promise<void> {
  await Speech.stop();
  await setPlaybackAudioMode().catch(() => undefined);
  const voice = await pickSpanishVoice();
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 25_000);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    Speech.speak(text, {
      language: 'es-MX',
      voice,
      rate: 0.95,
      pitch: 0.95,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
}
