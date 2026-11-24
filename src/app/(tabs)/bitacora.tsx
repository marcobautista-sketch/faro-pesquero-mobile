// Bitácora: historial de aves detectadas, guardado en el celular.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton, Body, Card, Chip, Screen } from '../../components/ui';
import { useAppStore } from '../../context/AppStore';
import { formatCoords } from '../../lib/geo';
import { SPECIES, type SpeciesLabel } from '../../lib/species';
import { alpha } from '../../lib/theme';

const BIRDS: SpeciesLabel[] = ['Piquero', 'Pelicano', 'Gaviota'];

function timeAgo(iso: string, now: number): string {
  const min = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h ${min % 60} min`;
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LogScreen() {
  const { detections, clearDetections, theme } = useAppStore();
  const { c, fs } = theme;
  const [filter, setFilter] = useState<SpeciesLabel | 'todas'>('todas');
  const now = Date.now();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of detections) map[d.species] = (map[d.species] ?? 0) + 1;
    return map;
  }, [detections]);

  const visible = filter === 'todas' ? detections : detections.filter((d) => d.species === filter);

  const confirmClear = () =>
    Alert.alert('Limpiar bitácora', '¿Desea limpiar toda la bitácora de capturas acústicas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: clearDetections },
    ]);

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: c.text, fontSize: fs(28), fontWeight: '900' }}>Bitácora</Text>
        <Body>{detections.length} detecciones guardadas en este celular.</Body>
      </View>

      <View style={styles.filters}>
        {(['todas', ...BIRDS] as const).map((key) => {
          const isOn = filter === key;
          const color = key === 'todas' ? c.accent : SPECIES[key].color;
          const label = key === 'todas' ? `Todas (${detections.length})` : `${SPECIES[key].commonName.split(' ')[0]} (${counts[key] ?? 0})`;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isOn }}
              style={[styles.filter, { borderColor: color, backgroundColor: isOn ? color : alpha(color, 0.12) }]}
            >
              <Text style={{ color: isOn ? '#04111F' : color, fontSize: fs(15), fontWeight: '900' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <Card style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons name="notebook-outline" size={44} color={c.faint} />
          <Text style={{ color: c.text, fontSize: fs(18), fontWeight: '900' }}>Sin registros</Text>
          <Body>Las aves que detecte el micrófono o el banco de pruebas aparecerán aquí.</Body>
        </Card>
      ) : (
        visible.map((d) => {
          const meta = SPECIES[d.species];
          return (
            <Card key={d.id} style={{ paddingLeft: 22, overflow: 'hidden' }}>
              <View style={[styles.accent, { backgroundColor: meta.color }]} />
              <View style={styles.between}>
                <View style={[styles.row, { flex: 1 }]}>
                  <MaterialCommunityIcons name={meta.icon} size={fs(26)} color={meta.color} />
                  <Text style={{ color: c.text, fontSize: fs(19), fontWeight: '900', flexShrink: 1 }}>{d.commonName}</Text>
                </View>
                <Text style={{ color: meta.color, fontSize: fs(22), fontWeight: '900' }}>{Math.round(d.confidence * 100)}%</Text>
              </View>
              <Body color={c.text} weight="700">
                {d.fishIndication}
              </Body>
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker" size={18} color={c.accent} />
                <Body size={14}>{d.location}</Body>
              </View>
              <Body size={13} color={c.faint}>
                {formatCoords(d.coordinates)} {d.usedRealGps ? '· GPS del celular' : '· zona de referencia'}
              </Body>
              <View style={styles.chips}>
                <Chip label={timeAgo(d.timestamp, now)} color={c.faint} icon="clock-outline" />
                <Chip
                  label={d.source === 'live_mic' ? 'Micrófono en vivo' : 'Banco de pruebas'}
                  color={d.source === 'live_mic' ? c.success : c.warning}
                  icon={d.source === 'live_mic' ? 'microphone' : 'play'}
                />
              </View>
            </Card>
          );
        })
      )}

      {detections.length > 0 ? (
        <BigButton label="Limpiar bitácora" icon="trash-can-outline" color={c.surfaceAlt} textColor={c.danger} onPress={confirmClear} compact />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 48, paddingHorizontal: 14, borderRadius: 999, borderWidth: 2, justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 },
});
