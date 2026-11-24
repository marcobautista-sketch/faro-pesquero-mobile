// Radar acústico: ondas que salen del centro. Con el micrófono abierto, crecen con el volumen del mar.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/AppStore';
import { alpha } from '../lib/theme';
import type { IconName } from './ui';

const SIZE = 210;
const RINGS = 3;

export function Radar({
  active,
  level,
  color,
  icon,
  caption,
}: {
  active: boolean;
  level: number;
  color: string;
  icon: IconName;
  caption: string;
}) {
  const { c, fs } = useTheme();
  const waves = useRef([...Array(RINGS)].map(() => new Animated.Value(0))).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const levelAnim = useRef(new Animated.Value(0)).current;

  // Ondas que se expanden en bucle, desfasadas entre sí.
  useEffect(() => {
    const loops = waves.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((i * (active ? 1600 : 3000)) / RINGS),
          Animated.timing(v, { toValue: 1, duration: active ? 1600 : 3000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, waves]);

  // Barrido giratorio del radar.
  useEffect(() => {
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: active ? 2400 : 6000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, sweep]);

  useEffect(() => {
    Animated.timing(levelAnim, { toValue: level, duration: 120, useNativeDriver: true }).start();
  }, [level, levelAnim]);

  const coreScale = levelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.wrap} accessibilityLabel={caption}>
      <View style={[styles.radar, { borderColor: alpha(color, 0.5), backgroundColor: alpha(color, 0.06) }]}>
        {[0.33, 0.66].map((r) => (
          <View
            key={r}
            style={[
              styles.grid,
              { width: SIZE * r, height: SIZE * r, borderRadius: (SIZE * r) / 2, borderColor: alpha(color, 0.25) },
            ]}
          />
        ))}
        <View style={[styles.cross, { backgroundColor: alpha(color, 0.18), width: SIZE, height: 1 }]} />
        <View style={[styles.cross, { backgroundColor: alpha(color, 0.18), width: 1, height: SIZE }]} />

        {waves.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              styles.wave,
              {
                borderColor: color,
                opacity: v.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, active ? 0.9 : 0.4, 0] }),
                transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }],
              },
            ]}
          />
        ))}

        <Animated.View style={[styles.sweep, { transform: [{ rotate }] }]}>
          <View style={[styles.sweepArm, { backgroundColor: alpha(color, active ? 0.85 : 0.35) }]} />
        </Animated.View>

        <Animated.View style={[styles.core, { backgroundColor: color, transform: [{ scale: coreScale }] }]}>
          <MaterialCommunityIcons name={icon} size={40} color="#04111F" />
        </Animated.View>
      </View>
      <View style={styles.captionRow}>
        <View style={[styles.dot, { backgroundColor: active ? c.success : c.faint }]} />
        <Text style={{ color: c.text, fontSize: fs(14), fontWeight: '900', letterSpacing: 1 }}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, paddingVertical: 4 },
  radar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grid: { position: 'absolute', borderWidth: 1 },
  cross: { position: 'absolute' },
  wave: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 3 },
  sweep: { position: 'absolute', width: SIZE, height: SIZE, alignItems: 'center' },
  sweepArm: { width: 3, height: SIZE / 2, borderRadius: 2 },
  core: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
