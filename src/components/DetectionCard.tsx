// Tarjeta grande con el ave detectada, la certeza del modelo y el consejo de pesca.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/AppStore';
import type { ActiveDetection } from '../context/AppStore';
import { alpha } from '../lib/theme';
import { BigButton, Body, Card, Chip, Label } from './ui';

export function DetectionCard({ detection, onSpeak }: { detection: ActiveDetection; onSpeak: () => void }) {
  const { c, fs } = useTheme();
  const r = detection.result;
  const pct = Math.round(r.confidence * 100);

  return (
    <Card accent={r.color} style={{ backgroundColor: alpha(r.color, c.bg === '#000000' ? 0.12 : 0.1) }}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: r.color }]}>
          <MaterialCommunityIcons name={r.icon} size={34} color="#04111F" />
        </View>
        <View style={{ flex: 1 }}>
          <Label color={c.muted}>{r.species === 'Ruido_Fondo' ? 'Sonido del mar' : 'Ave marina detectada'}</Label>
          <Text style={{ color: c.text, fontSize: fs(28), fontWeight: '900', lineHeight: fs(32) }}>{r.commonName}</Text>
          <Text style={{ color: c.muted, fontSize: fs(14), fontStyle: 'italic' }}>{r.scientificName}</Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={styles.between}>
          <Label color={c.muted}>Certeza del modelo</Label>
          <Text style={{ color: r.color, fontSize: fs(28), fontWeight: '900' }}>{pct}%</Text>
        </View>
        <View style={[styles.bar, { backgroundColor: alpha('#000000', 0.45), borderColor: alpha('#FFFFFF', 0.15) }]}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: r.color }]} />
        </View>
      </View>

      <View style={[styles.advice, { backgroundColor: alpha('#000000', 0.4), borderColor: alpha('#FFFFFF', 0.12) }]}>
        <View style={styles.adviceRow}>
          <MaterialCommunityIcons name="fish" size={fs(22)} color={c.warning} />
          <View style={{ flex: 1, gap: 2 }}>
            <Label color={c.warning}>Indicación de pesca</Label>
            <Body color={c.text} size={18} weight="800">
              {r.fishIndication}
            </Body>
          </View>
        </View>
        <View style={[styles.adviceRow, styles.divider]}>
          <MaterialCommunityIcons name="shield-check" size={fs(22)} color={c.success} />
          <View style={{ flex: 1, gap: 2 }}>
            <Label color={c.success}>Consejo para el patrón</Label>
            <Body color={c.muted} size={16} weight="600">
              {r.advice}
            </Body>
          </View>
        </View>
      </View>

      <View style={styles.between}>
        <Chip label={detection.soundName} color={c.accent} icon="sine-wave" />
        <Chip label={`${r.executionTimeMs} ms en el celular`} color={c.faint} icon="chip" />
      </View>

      <BigButton label="Escuchar consejo con voz" icon="volume-high" color="#FFFFFF" onPress={onSpeak} compact />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  bar: { height: 16, borderRadius: 999, borderWidth: 1, padding: 2 },
  barFill: { height: '100%', borderRadius: 999 },
  advice: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  adviceRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 },
});
