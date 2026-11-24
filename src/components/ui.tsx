// Piezas visuales reutilizables, pensadas para pescadores mayores:
// botones de al menos 64 px de alto, letra grande y alto contraste.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/AppStore';
import { alpha } from '../lib/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: ViewStyle; accent?: string }) {
  const { c, borderWidth } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: accent ?? c.border, borderWidth: accent ? 2 : borderWidth },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children, icon, color }: { children: ReactNode; icon?: IconName; color?: string }) {
  const { c, fs } = useTheme();
  return (
    <View style={styles.row}>
      {icon ? <MaterialCommunityIcons name={icon} size={fs(22)} color={color ?? c.accent} /> : null}
      <Text style={{ color: c.text, fontSize: fs(20), fontWeight: '900', flexShrink: 1 }}>{children}</Text>
    </View>
  );
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  const { c, fs } = useTheme();
  return (
    <Text style={{ color: color ?? c.faint, fontSize: fs(13), fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export function Body({ children, color, size = 15, weight = '500' }: { children: ReactNode; color?: string; size?: number; weight?: '500' | '600' | '700' | '800' | '900' }) {
  const { c, fs } = useTheme();
  return <Text style={{ color: color ?? c.muted, fontSize: fs(size), fontWeight: weight, lineHeight: fs(size) * 1.35 }}>{children}</Text>;
}

export function Chip({ label, color, icon }: { label: string; color: string; icon?: IconName }) {
  const { fs } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: alpha(color, 0.18), borderColor: alpha(color, 0.6) }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={fs(14)} color={color} /> : null}
      <Text style={{ color, fontSize: fs(13), fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

export function BigButton({
  label,
  onPress,
  icon,
  color,
  textColor = '#04111F',
  disabled,
  loading,
  compact,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  color: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
}) {
  const { fs } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.bigButton,
        { backgroundColor: color, minHeight: compact ? 56 : 72, opacity: disabled ? 0.45 : 1 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={fs(compact ? 22 : 28)} color={textColor} />
      ) : null}
      <Text style={{ color: textColor, fontSize: fs(compact ? 16 : 19), fontWeight: '900', textAlign: 'center', flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: IconName;
}) {
  const { c, fs } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.toggleRow, { borderColor: c.border }]}
    >
      <MaterialCommunityIcons name={icon} size={fs(26)} color={value ? c.accent : c.faint} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.text, fontSize: fs(16), fontWeight: '800' }}>{label}</Text>
        {hint ? <Text style={{ color: c.faint, fontSize: fs(13) }}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.success, false: '#334155' }} />
    </Pressable>
  );
}

export function Stat({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  const { c, fs } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Label>{label}</Label>
      <Text style={{ color: color ?? c.text, fontSize: fs(26), fontWeight: '900', fontVariant: ['tabular-nums'] }}>
        {value}
        {unit ? <Text style={{ fontSize: fs(15), fontWeight: '700', color: c.muted }}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 20, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
