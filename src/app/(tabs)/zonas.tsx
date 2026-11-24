// Zonas de pesca de Chorrillos con brújula: la flecha apunta a la zona elegida usando GPS + magnetómetro.
import { useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompassDial } from '../../components/Gauges';
import { Body, Card, Chip, Label, Screen } from '../../components/ui';
import { useAppStore } from '../../context/AppStore';
import { useLocation } from '../../context/LocationContext';
import { FISHING_SPOTS } from '../../lib/data';
import { bearingDeg, cardinal, distanceKm, formatDistance, kmToNauticalMiles, msToKnots } from '../../lib/geo';
import { SPECIES } from '../../lib/species';
import { alpha } from '../../lib/theme';
import { useHeading } from '../../hooks/useSensors';

export default function SpotsScreen() {
  const focused = useIsFocused();
  const { theme } = useAppStore();
  const { c, fs, borderWidth } = theme;
  const location = useLocation();
  const heading = useHeading(focused);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const spots = useMemo(
    () =>
      FISHING_SPOTS.map((spot) => ({
        spot,
        km: distanceKm(location.origin, spot),
        bearing: bearingDeg(location.origin, spot),
      })).sort((a, b) => a.km - b.km),
    [location.origin],
  );

  // Por defecto, la zona más cercana que no sea donde ya está el bote (a más de 150 m).
  const selected = spots.find((s) => s.spot.id === selectedId) ?? spots.find((s) => s.km > 0.15) ?? spots[0];
  const color = SPECIES[selected.spot.commonSpecies[0]].color;
  const speedKnots = location.fix?.speedMs ? msToKnots(location.fix.speedMs) : 0;
  const etaMin = speedKnots > 0.5 ? Math.round((kmToNauticalMiles(selected.km) / speedKnots) * 60) : null;
  const turn = heading.heading !== null ? ((selected.bearing - heading.heading + 540) % 360) - 180 : null;

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: c.text, fontSize: fs(28), fontWeight: '900' }}>Zonas de pesca</Text>
        <Body>Elija una zona: la flecha le indica hacia dónde navegar.</Body>
      </View>

      <Card accent={color}>
        <Label color={color}>Rumbo a</Label>
        <Text style={{ color: c.text, fontSize: fs(24), fontWeight: '900' }}>{selected.spot.name}</Text>
        <CompassDial heading={heading.heading} target={selected.bearing} color={color} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Label>Distancia</Label>
            <Text style={{ color: c.text, fontSize: fs(26), fontWeight: '900' }}>{formatDistance(selected.km)}</Text>
            <Body size={13}>{kmToNauticalMiles(selected.km).toFixed(2)} millas náuticas</Body>
          </View>
          <View style={{ flex: 1 }}>
            <Label>Rumbo</Label>
            <Text style={{ color: color, fontSize: fs(26), fontWeight: '900' }}>
              {Math.round(selected.bearing)}° {cardinal(selected.bearing)}
            </Text>
            <Body size={13}>{etaMin !== null ? `Llegada en ~${etaMin} min` : 'Detenido'}</Body>
          </View>
        </View>
        {heading.error ? (
          <Body color={c.warning}>{heading.error}</Body>
        ) : turn === null ? (
          <Body>Calibrando la brújula… mueva el celular en forma de 8.</Body>
        ) : (
          <Body color={c.text} size={17} weight="800">
            {Math.abs(turn) < 15 ? '¡De frente! Va en buen rumbo.' : turn > 0 ? `Gire ${Math.round(turn)}° a estribor (derecha)` : `Gire ${Math.round(-turn)}° a babor (izquierda)`}
          </Body>
        )}
        {!location.usingRealGps ? (
          <Body size={13} color={c.warning}>
            Sin GPS todavía: las distancias se calculan desde el Muelle de Chorrillos.
          </Body>
        ) : null}
      </Card>

      {spots.map(({ spot, km, bearing }) => {
        const isSelected = spot.id === selected.spot.id;
        return (
          <Pressable
            key={spot.id}
            onPress={() => setSelectedId(spot.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.spot,
              {
                backgroundColor: isSelected ? alpha(c.accent, 0.12) : c.surface,
                borderColor: isSelected ? c.accent : c.border,
                borderWidth: isSelected ? 3 : borderWidth,
              },
            ]}
          >
            <View style={styles.between}>
              <Text style={{ color: c.text, fontSize: fs(18), fontWeight: '900', flex: 1 }}>{spot.name}</Text>
              <Text style={{ color: c.accent, fontSize: fs(16), fontWeight: '900' }}>
                {formatDistance(km)} · {cardinal(bearing)}
              </Text>
            </View>
            <Body size={14}>{spot.description}</Body>
            <View style={styles.chips}>
              <Chip label={`${spot.depthMeters} m de fondo`} color={c.accent} icon="waves" />
              {spot.commonSpecies.map((s) => (
                <Chip key={s} label={SPECIES[s].commonName} color={SPECIES[s].color} icon={SPECIES[s].icon} />
              ))}
            </View>
            <Body size={14} color={c.text} weight="700">
              Arte recomendado: {spot.recommendedNet}
            </Body>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  spot: { borderRadius: 18, padding: 14, gap: 8, minHeight: 64 },
});
