// Indicadores animados: brújula hacia una zona, inclinómetro del bote y gráfico de presión.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/AppStore';
import { alpha } from '../lib/theme';

// Gira por el camino más corto (de 350° a 10° son 20°, no 340°).
function useSmoothRotation(deg: number) {
  const anim = useRef(new Animated.Value(deg)).current;
  const current = useRef(deg);
  useEffect(() => {
    let delta = (((deg - current.current) % 360) + 540) % 360 - 180;
    if (!Number.isFinite(delta)) delta = 0;
    current.current += delta;
    Animated.timing(anim, { toValue: current.current, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [deg, anim]);
  return anim.interpolate({ inputRange: [-36000, 36000], outputRange: ['-36000deg', '36000deg'] });
}

const DIAL = 230;

// Flecha que apunta a la zona elegida: rumbo a la zona menos hacia dónde mira el celular.
export function CompassDial({ heading, target, color }: { heading: number | null; target: number; color: string }) {
  const { c, fs } = useTheme();
  const dialRotation = useSmoothRotation(-(heading ?? 0));
  const arrowRotation = useSmoothRotation(target - (heading ?? 0));
  const marks = ['N', 'E', 'S', 'O'];

  return (
    <View style={[styles.dial, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: dialRotation }] }]}>
        {marks.map((m, i) => (
          <View key={m} style={[StyleSheet.absoluteFill, { alignItems: 'center', transform: [{ rotate: `${i * 90}deg` }] }]}>
            <Text style={{ marginTop: 8, color: m === 'N' ? c.danger : c.muted, fontSize: fs(18), fontWeight: '900' }}>{m}</Text>
          </View>
        ))}
        {[...Array(12)].map((_, i) => (
          <View key={i} style={[StyleSheet.absoluteFill, { alignItems: 'center', transform: [{ rotate: `${i * 30}deg` }] }]}>
            {i % 3 !== 0 ? <View style={{ marginTop: 10, width: 2, height: 12, backgroundColor: c.faint }} /> : null}
          </View>
        ))}
      </Animated.View>
      <Animated.View style={[styles.arrowWrap, { transform: [{ rotate: arrowRotation }] }]}>
        <MaterialCommunityIcons name="navigation" size={96} color={color} />
      </Animated.View>
      <View style={[styles.lubber, { backgroundColor: c.text }]} />
    </View>
  );
}

// Horizonte que se queda nivelado mientras el celular (el bote) se balancea a los lados.
export function Inclinometer({ rollDeg, color }: { rollDeg: number; color: string }) {
  const { c } = useTheme();
  const roll = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(roll, { toValue: rollDeg, duration: 100, useNativeDriver: true }).start();
  }, [rollDeg, roll]);

  return (
    <View style={[styles.horizonBox, { borderColor: c.border }]}>
      <Animated.View
        style={[
          styles.horizon,
          { transform: [{ rotate: roll.interpolate({ inputRange: [-180, 180], outputRange: ['180deg', '-180deg'] }) }] },
        ]}
      >
        <View style={{ flex: 1, backgroundColor: alpha('#38BDF8', 0.25) }} />
        <View style={{ height: 3, backgroundColor: color }} />
        <View style={{ flex: 1, backgroundColor: alpha('#0EA5E9', 0.55) }} />
      </Animated.View>
      <View style={styles.boatMark}>
        <MaterialCommunityIcons name="sail-boat" size={40} color={c.text} />
      </View>
    </View>
  );
}

// Barras de la presión en los últimos minutos.
export function PressureBars({ values, color }: { values: number[]; color: string }) {
  const { c } = useTheme();
  if (values.length < 2) {
    return <View style={[styles.bars, { borderColor: c.border }]} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.2);
  return (
    <View style={[styles.bars, { borderColor: c.border }]}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            marginHorizontal: 1,
            height: `${15 + ((v - min) / span) * 85}%`,
            backgroundColor: i === values.length - 1 ? color : alpha(color, 0.45),
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dial: {
    width: DIAL,
    height: DIAL,
    borderRadius: DIAL / 2,
    borderWidth: 3,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  arrowWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  lubber: { position: 'absolute', top: 0, width: 4, height: 18, borderRadius: 2 },
  horizonBox: {
    height: 150,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizon: { position: 'absolute', width: '220%', height: '220%' },
  boatMark: { alignItems: 'center', justifyContent: 'center' },
  bars: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    paddingHorizontal: 2,
  },
});
