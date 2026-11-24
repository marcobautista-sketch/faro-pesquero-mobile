// Pantalla principal: radar acústico, micrófono en vivo, última detección y banco de pruebas.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DetectionCard } from '../../components/DetectionCard';
import { Radar } from '../../components/Radar';
import { Soundboard } from '../../components/Soundboard';
import { BigButton, Body, Card, Chip, Label, Screen, type IconName } from '../../components/ui';
import { useAppStore } from '../../context/AppStore';
import { useClassifier } from '../../context/ClassifierContext';
import { useLocation } from '../../context/LocationContext';
import { voiceText } from '../../hooks/useDetectionHandler';
import { useLiveListener } from '../../hooks/useLiveListener';
import { alpha } from '../../lib/theme';

function HeaderButton({ icon, active, onPress, label }: { icon: IconName; active: boolean; onPress: () => void; label: string }) {
  const { theme } = useAppStore();
  const { c } = theme;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.headerButton, { borderColor: active ? c.accent : c.border, backgroundColor: active ? alpha(c.accent, 0.18) : c.surface }]}
    >
      <MaterialCommunityIcons name={icon} size={28} color={active ? c.accent : c.faint} />
    </Pressable>
  );
}

export default function ListenScreen() {
  const { user, active, theme, updatePreferences } = useAppStore();
  const { c, fs } = theme;
  const classifier = useClassifier();
  const location = useLocation();
  const listener = useLiveListener();
  const [samplePlaying, setSamplePlaying] = useState(false);
  const prefs = user.preferences;

  const onPlayingChange = useCallback((playing: boolean) => setSamplePlaying(playing), []);
  const stopListening = listener.stop;

  const radarActive = listener.isActive || samplePlaying;
  const detectionColor = active ? active.result.color : c.accent;
  const caption =
    listener.state === 'listening'
      ? 'RADAR ACTIVO · ESCUCHANDO EL MAR'
      : listener.state === 'speaking'
        ? 'VOZ DEL FARO HABLANDO'
        : listener.state === 'starting'
          ? 'ABRIENDO MICRÓFONO…'
          : samplePlaying
            ? 'REPRODUCIENDO SONIDO DE PRUEBA'
            : 'RADAR ACÚSTICO EN ESPERA';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: fs(28), fontWeight: '900' }}>Faro Pesquero</Text>
          <Text style={{ color: c.accent, fontSize: fs(14), fontWeight: '800' }}>Caleta de Chorrillos · Mar de Grau</Text>
        </View>
        <HeaderButton
          icon={prefs.voiceAlerts ? 'volume-high' : 'volume-off'}
          active={prefs.voiceAlerts}
          label={prefs.voiceAlerts ? 'Silenciar Voz del Faro' : 'Activar Voz del Faro'}
          onPress={() => updatePreferences({ voiceAlerts: !prefs.voiceAlerts })}
        />
        <HeaderButton
          icon="white-balance-sunny"
          active={prefs.highContrastMode}
          label="Modo Sol: máximo contraste para el reflejo del mar"
          onPress={() => updatePreferences({ highContrastMode: !prefs.highContrastMode })}
        />
      </View>

      <Card>
        <View style={styles.row}>
          <View style={[styles.anchor, { backgroundColor: alpha(c.accent, 0.18), borderColor: alpha(c.accent, 0.4) }]}>
            <MaterialCommunityIcons name="anchor" size={28} color={c.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Label color={c.accent}>Patrón de chalana</Label>
            <Text style={{ color: c.text, fontSize: fs(17), fontWeight: '900' }}>
              {user.name}
            </Text>
            <Body size={14}>
              {user.boatName} · {user.registrationNumber}
            </Body>
          </View>
        </View>
        <View style={styles.chips}>
          <Chip label="Listo en el mar" color={c.success} icon="check-circle" />
          <Chip
            label={location.usingRealGps ? 'GPS activo' : location.status === 'denied' ? 'GPS sin permiso' : 'Buscando GPS'}
            color={location.usingRealGps ? c.success : c.warning}
            icon="crosshairs-gps"
          />
          <Chip label="Sin internet" color={c.accent} icon="wifi-off" />
        </View>
      </Card>

      <Card>
        <Radar
          active={radarActive}
          level={listener.level}
          color={radarActive ? detectionColor : c.faint}
          icon={active && radarActive ? active.result.icon : 'radar'}
          caption={caption}
        />
        {listener.state === 'listening' && listener.lastHeard ? (
          <Body color={c.muted} size={14}>
            Oyendo ahora: <Text style={{ color: listener.lastHeard.color, fontWeight: '900' }}>{listener.lastHeard.commonName}</Text>{' '}
            ({Math.round(listener.lastHeard.confidence * 100)}%)
          </Body>
        ) : null}
        {listener.isActive ? (
          <BigButton label="DETENER ESCUCHA EN VIVO" icon="stop-circle" color={c.danger} textColor="#FFFFFF" onPress={listener.stop} />
        ) : (
          <BigButton
            label={classifier.status === 'ready' ? 'ACTIVAR MICRÓFONO EN VIVO' : 'CARGANDO MODELO…'}
            icon="microphone"
            color={c.success}
            onPress={() => void listener.start()}
            loading={classifier.status === 'loading'}
            disabled={classifier.status !== 'ready'}
          />
        )}
        {listener.error ? <Body color={c.danger}>{listener.error}</Body> : null}
        {classifier.status === 'error' ? <Body color={c.danger}>El modelo no cargó: {classifier.error}</Body> : null}
      </Card>

      {active ? (
        <DetectionCard detection={active} onSpeak={() => void listener.announce(voiceText(active.result))} />
      ) : (
        <Card style={{ alignItems: 'center', borderStyle: 'dashed' }}>
          <MaterialCommunityIcons name="waves" size={44} color={alpha(c.accent, 0.7)} />
          <Text style={{ color: c.text, fontSize: fs(20), fontWeight: '900' }}>El mar está en silencio</Text>
          <Body>Active el micrófono o toque un ave del banco de pruebas para ver la detección aquí.</Body>
        </Card>
      )}

      <Card>
        <Soundboard beforePlay={stopListening} onPlayingChange={onPlayingChange} />
      </Card>

      <View style={styles.footer}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="shield-check" size={18} color={c.success} />
          <Body size={13} color={c.muted}>
            Modelo acústico: Edge Impulse #{classifier.project?.id ?? 1134969} ({classifier.project?.name ?? 'Faro_Pesquero_IA'})
          </Body>
        </View>
        <Body size={13} color={c.faint}>
          El modelo corre dentro del celular: funciona en altamar sin señal. Desarrollado para la Asociación de Pescadores
          Artesanales José Olaya Balandra de Chorrillos.
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerButton: { width: 64, height: 64, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  anchor: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { gap: 6, paddingTop: 4 },
});
