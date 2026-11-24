// Sensores del bote: oleaje (acelerómetro + giroscopio), presión (barómetro), GPS y brújula (magnetómetro).
import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Inclinometer, PressureBars } from '../../components/Gauges';
import { BigButton, Body, Card, Chip, Stat, Title, Screen } from '../../components/ui';
import { useAppStore } from '../../context/AppStore';
import { useLocation } from '../../context/LocationContext';
import { cardinal, formatCoords, msToKnots } from '../../lib/geo';
import { speak } from '../../lib/voice';
import { useBarometer, useHeading, useSeaState, type PressureTrend, type SeaLevel } from '../../hooks/useSensors';

const SEA: Record<SeaLevel, { label: string; advice: string; color: string }> = {
  calmo: { label: 'Mar calmo', advice: 'Buen momento para calar la red. El bote está estable.', color: '#10B981' },
  moderado: { label: 'Marejada', advice: 'Oleaje moderado: asegure los aparejos y mantenga la proa a la ola.', color: '#F59E0B' },
  fuerte: { label: 'Oleaje fuerte', advice: '¡Cuidado! Recoja la red, póngase el chaleco y aléjese de las peñas.', color: '#DC2626' },
};

const TREND: Record<PressureTrend, { label: string; advice: string; color: string }> = {
  midiendo: { label: 'Midiendo…', advice: 'Se necesitan unos segundos de lecturas para ver la tendencia.', color: '#93AAC2' },
  estable: { label: 'Estable', advice: 'Tiempo estable para faenar.', color: '#10B981' },
  subiendo: { label: 'Subiendo', advice: 'La presión sube: se espera buen tiempo.', color: '#22D3EE' },
  bajando: { label: 'Bajando', advice: 'La presión baja: puede venir mal tiempo. Considere volver al muelle.', color: '#DC2626' },
};

export default function SensorsScreen() {
  const focused = useIsFocused();
  const { user, theme } = useAppStore();
  const { c, fs } = theme;
  const sea = useSeaState(focused);
  const pressure = useBarometer(focused);
  const heading = useHeading(focused);
  const location = useLocation();
  const prefs = user.preferences;

  // Aviso con vibración (y voz) cuando el mar pasa a oleaje fuerte; como máximo cada 15 segundos.
  const lastWarning = useRef(0);
  const prevLevel = useRef<SeaLevel>('calmo');
  useEffect(() => {
    const now = Date.now();
    if (sea.level === 'fuerte' && prevLevel.current !== 'fuerte' && now - lastWarning.current > 15_000) {
      lastWarning.current = now;
      if (prefs.vibrationFeedback) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (prefs.voiceAlerts) void speak('¡Oleaje fuerte! Recoja la red y póngase el chaleco.');
    }
    prevLevel.current = sea.level;
  }, [sea.level, prefs.vibrationFeedback, prefs.voiceAlerts]);

  const seaInfo = SEA[sea.level];
  const trendInfo = TREND[pressure.trend];
  const fix = location.fix;

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: c.text, fontSize: fs(28), fontWeight: '900' }}>Sensores del bote</Text>
        <Body>Lo que el celular siente del mar, el clima y la posición.</Body>
      </View>

      <Card accent={sea.available ? seaInfo.color : undefined}>
        <View style={styles.between}>
          <Title icon="waves" color={seaInfo.color}>
            Estado del mar
          </Title>
          <Chip label="Acelerómetro + giroscopio" color={c.faint} icon="chip" />
        </View>
        {sea.available === false ? (
          <Body color={c.warning}>Este celular no tiene sensor de movimiento.</Body>
        ) : (
          <>
            <Inclinometer rollDeg={sea.rollDeg} color={seaInfo.color} />
            <Text style={{ color: seaInfo.color, fontSize: fs(30), fontWeight: '900' }}>{seaInfo.label}</Text>
            <Body color={c.text} size={16} weight="700">
              {seaInfo.advice}
            </Body>
            <View style={styles.stats}>
              <Stat label="Balanceo" value={sea.swingDeg.toFixed(0)} unit="°" />
              <Stat label="Escora" value={sea.rollDeg.toFixed(0)} unit="°" />
              <Stat label="Sacudida" value={sea.shake.toFixed(1)} unit="m/s²" />
            </View>
            <Body size={13} color={c.faint}>
              Demo: mueva o sacuda el celular para simular el oleaje.
            </Body>
          </>
        )}
      </Card>

      <Card accent={pressure.available ? trendInfo.color : undefined}>
        <View style={styles.between}>
          <Title icon="gauge" color={trendInfo.color}>
            Presión del aire
          </Title>
          <Chip label="Barómetro" color={c.faint} icon="chip" />
        </View>
        {pressure.available === false ? (
          <Body color={c.warning}>Este celular no tiene barómetro.</Body>
        ) : (
          <>
            <View style={styles.stats}>
              <Stat label="Presión" value={pressure.hPa !== null ? pressure.hPa.toFixed(1) : '—'} unit="hPa" />
              <Stat
                label="Cambio"
                value={`${pressure.changeHPa >= 0 ? '+' : ''}${pressure.changeHPa.toFixed(2)}`}
                unit="hPa"
                color={trendInfo.color}
              />
            </View>
            <PressureBars values={pressure.history} color={trendInfo.color} />
            <View style={styles.between}>
              <Chip label={`Tendencia: ${trendInfo.label}`} color={trendInfo.color} />
              {pressure.relativeAltitude !== null ? (
                <Chip label={`Altura relativa ${pressure.relativeAltitude.toFixed(1)} m`} color={c.faint} />
              ) : null}
            </View>
            <Body color={c.text} size={16} weight="700">
              {trendInfo.advice}
            </Body>
            <Body size={13} color={c.faint}>
              Demo: subir o bajar un piso con el celular cambia la presión.
            </Body>
          </>
        )}
      </Card>

      <Card>
        <View style={styles.between}>
          <Title icon="crosshairs-gps">Posición GPS</Title>
          <Chip label={location.usingRealGps ? 'Señal' : 'Sin señal'} color={location.usingRealGps ? c.success : c.warning} />
        </View>
        {location.status === 'denied' || location.status === 'error' ? (
          <>
            <Body color={c.warning}>Sin permiso de ubicación. Actívelo en Ajustes › Expo Go › Ubicación.</Body>
            <BigButton label="Volver a pedir permiso" icon="crosshairs-gps" color={c.accent} onPress={location.retry} compact />
          </>
        ) : fix ? (
          <>
            <Body color={c.text} size={17} weight="800">
              {formatCoords(fix)}
            </Body>
            <View style={styles.stats}>
              <Stat label="Velocidad" value={fix.speedMs !== null ? msToKnots(fix.speedMs).toFixed(1) : '0.0'} unit="nudos" />
              <Stat label="Precisión" value={fix.accuracy !== null ? `±${Math.round(fix.accuracy)}` : '—'} unit="m" />
            </View>
            {location.nearestSpot ? (
              <Body>
                Zona más cercana: <Text style={{ color: c.accent, fontWeight: '900' }}>{location.nearestSpot.spot.name}</Text> a{' '}
                {location.nearestSpot.km.toFixed(1)} km
              </Body>
            ) : null}
          </>
        ) : (
          <Body>Buscando satélites…</Body>
        )}
      </Card>

      <Card>
        <View style={styles.between}>
          <Title icon="compass-outline">Brújula</Title>
          <Chip label="Magnetómetro" color={c.faint} icon="chip" />
        </View>
        {heading.error ? (
          <Body color={c.warning}>{heading.error}</Body>
        ) : heading.heading === null ? (
          <Body>Calibrando… mueva el celular en forma de 8.</Body>
        ) : (
          <View style={styles.stats}>
            <Stat label="Rumbo" value={`${Math.round(heading.heading)}°`} />
            <Stat label="Dirección" value={cardinal(heading.heading)} color={c.accent} />
          </View>
        )}
        <Body size={13} color={c.faint}>
          En la pestaña Zonas, la brújula apunta a cada zona de pesca.
        </Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  stats: { flexDirection: 'row', gap: 12 },
});
