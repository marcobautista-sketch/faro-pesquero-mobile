// Banco de pruebas: reproduce el canto real de cada ave y lo clasifica con el modelo del celular.
// Sirve para la demo aunque no haya aves cerca.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/AppStore';
import { useClassifier } from '../context/ClassifierContext';
import { useDetectionHandler } from '../hooks/useDetectionHandler';
import { SAMPLE_PCM_BASE64 } from '../model/generated/samplePcm';
import { BIRD_SAMPLES, SPECIES, type BirdSample } from '../lib/species';
import { alpha } from '../lib/theme';
import { setPlaybackAudioMode, speak } from '../lib/voice';
import { Body, Chip, Title } from './ui';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Soundboard({ beforePlay, onPlayingChange }: { beforePlay: () => void; onPlayingChange: (playing: boolean) => void }) {
  const { c, fs, borderWidth } = useTheme();
  const { status, classifyPcm } = useClassifier();
  const { handle } = useDetectionHandler();
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPlayingChange(playerStatus.playing);
    if (!playerStatus.playing && playerStatus.didJustFinish) setPlayingId(null);
  }, [playerStatus.playing, playerStatus.didJustFinish, onPlayingChange]);

  const test = async (sample: BirdSample) => {
    setError(null);
    setBusyId(sample.id);
    setPlayingId(sample.id);
    try {
      beforePlay();
      await setPlaybackAudioMode();
      player.replace(sample.sound);
      await player.seekTo(0);
      player.play();

      const result = await classifyPcm(SAMPLE_PCM_BASE64[sample.id]);
      const say = handle(result, sample.name, 'demo_sample');
      if (say) {
        await wait(1100); // que termine el canto antes de hablar
        await speak(say);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPlayingId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.between}>
        <Title icon="play-circle" color={c.warning}>
          Banco de pruebas
        </Title>
        <Chip label={status === 'ready' ? 'Modelo listo' : status === 'error' ? 'Modelo con error' : 'Cargando modelo'} color={status === 'ready' ? c.success : status === 'error' ? c.danger : c.warning} />
      </View>
      <Body>Toque un ave: suena su canto real y el modelo del celular lo reconoce.</Body>

      {BIRD_SAMPLES.map((sample) => {
        const color = SPECIES[sample.label].color;
        const isPlaying = playingId === sample.id && playerStatus.playing;
        const isBusy = busyId === sample.id;
        return (
          <Pressable
            key={sample.id}
            onPress={() => void test(sample)}
            disabled={status !== 'ready' || busyId !== null}
            accessibilityRole="button"
            accessibilityLabel={`Reproducir y clasificar el sonido de ${sample.name}`}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isPlaying ? alpha(color, 0.18) : c.surface,
                borderColor: isPlaying ? color : alpha(color, 0.7),
                borderWidth: isPlaying ? 3 : Math.max(2, borderWidth),
                opacity: status !== 'ready' ? 0.5 : 1,
              },
              pressed && { transform: [{ scale: 0.985 }] },
            ]}
          >
            <View style={[styles.accent, { backgroundColor: color }]} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: c.text, fontSize: fs(18), fontWeight: '900' }}>{sample.name}</Text>
              <Text style={{ color: c.muted, fontSize: fs(14), fontWeight: '600' }}>{sample.tagline}</Text>
              <Text style={{ color, fontSize: fs(13), fontWeight: '800' }}>Objetivo: {sample.fishTarget}</Text>
            </View>
            <View style={[styles.play, { backgroundColor: isPlaying ? color : alpha('#FFFFFF', 0.1), borderColor: alpha('#FFFFFF', 0.25) }]}>
              {isBusy && !isPlaying ? (
                <ActivityIndicator color={c.accent} />
              ) : (
                <MaterialCommunityIcons name={isPlaying ? 'volume-high' : 'play'} size={28} color={isPlaying ? '#04111F' : c.text} />
              )}
            </View>
          </Pressable>
        );
      })}
      {error ? <Body color={c.danger}>{error}</Body> : null}
      <Body color={c.faint} size={13}>
        Frecuencia del modelo: 16 000 Hz · ventana de 1,0 s
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  button: {
    minHeight: 84,
    borderRadius: 18,
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 },
  play: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
