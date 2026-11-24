// Credencial del pescador y preferencias de accesibilidad.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { BigButton, Body, Card, Label, Screen, Title, ToggleRow } from '../../components/ui';
import { useAppStore } from '../../context/AppStore';
import { useClassifier } from '../../context/ClassifierContext';
import type { UserProfile } from '../../lib/data';
import { speak } from '../../lib/voice';

type EditableField = 'name' | 'nickname' | 'boatName' | 'registrationNumber' | 'phone';
const FIELDS: { key: EditableField; label: string }[] = [
  { key: 'name', label: 'Nombre completo' },
  { key: 'nickname', label: 'Apodo en la caleta' },
  { key: 'boatName', label: 'Embarcación' },
  { key: 'registrationNumber', label: 'Matrícula DICAPI' },
  { key: 'phone', label: 'Teléfono' },
];

function InfoRow({ label, value, half }: { label: string; value: string; half?: boolean }) {
  const { theme } = useAppStore();
  return (
    <View style={[{ gap: 2 }, half && { flex: 1 }]}>
      <Label>{label}</Label>
      <Text style={{ color: theme.c.text, fontSize: theme.fs(16), fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, updateUser, updatePreferences, resetDemo, theme } = useAppStore();
  const { c, fs } = theme;
  const classifier = useClassifier();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Pick<UserProfile, EditableField>>(user);
  const prefs = user.preferences;

  const startEdit = () => {
    setDraft(user);
    setEditing(true);
  };

  const save = () => {
    updateUser(Object.fromEntries(FIELDS.map(({ key }) => [key, draft[key].trim() || user[key]])) as Pick<UserProfile, EditableField>);
    setEditing(false);
  };

  const confirmReset = () =>
    Alert.alert('Restablecer demo', 'Se borran los cambios del perfil y la bitácora vuelve a los datos de ejemplo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restablecer', style: 'destructive', onPress: resetDemo },
    ]);

  return (
    <Screen>
      <Card accent={c.accent}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="account-circle" size={72} color={c.accent} />
          <View style={{ flex: 1 }}>
            <Label color={c.accent}>{user.role}</Label>
            <Text style={{ color: c.text, fontSize: fs(22), fontWeight: '900' }}>{user.name}</Text>
            <Body color={c.warning} weight="800">
              “{user.nickname}”
            </Body>
          </View>
        </View>

        {editing ? (
          <View style={{ gap: 12 }}>
            {FIELDS.map(({ key, label }) => (
              <View key={key} style={{ gap: 4 }}>
                <Label>{label}</Label>
                <TextInput
                  value={draft[key]}
                  onChangeText={(text) => setDraft((d) => ({ ...d, [key]: text }))}
                  style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surfaceAlt, fontSize: fs(17) }]}
                  placeholderTextColor={c.faint}
                  autoCapitalize={key === 'registrationNumber' ? 'characters' : 'words'}
                  keyboardType={key === 'phone' ? 'phone-pad' : 'default'}
                />
              </View>
            ))}
            <BigButton label="Guardar datos" icon="content-save" color={c.success} onPress={save} compact />
            <BigButton label="Cancelar" color={c.surfaceAlt} textColor={c.text} onPress={() => setEditing(false)} compact />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={styles.grid}>
              <InfoRow half label="Embarcación" value={user.boatName} />
              <InfoRow half label="Matrícula DICAPI" value={user.registrationNumber} />
            </View>
            <View style={styles.grid}>
              <InfoRow half label="Experiencia" value={`${user.yearsOfExperience} años en el mar`} />
              <InfoRow half label="Teléfono" value={user.phone} />
            </View>
            <InfoRow label="Caleta base" value={`${user.pier} · ${user.cove}`} />
            <InfoRow label="Asociación" value={user.association} />
            <BigButton label="Editar datos" icon="pencil" color={c.accent} onPress={startEdit} compact />
          </View>
        )}
      </Card>

      <Card>
        <Title icon="tune">Preferencias</Title>
        <ToggleRow
          icon="white-balance-sunny"
          label="Modo Sol"
          hint="Máximo contraste para el reflejo del sol en el mar"
          value={prefs.highContrastMode}
          onChange={(v) => updatePreferences({ highContrastMode: v })}
        />
        <ToggleRow
          icon="volume-high"
          label="Voz del Faro"
          hint="Lee en voz alta cada ave detectada y su consejo"
          value={prefs.voiceAlerts}
          onChange={(v) => updatePreferences({ voiceAlerts: v })}
        />
        <ToggleRow
          icon="format-size"
          label="Letra grande"
          hint="Textos más grandes para leer sin lentes"
          value={prefs.largeFont}
          onChange={(v) => updatePreferences({ largeFont: v })}
        />
        <ToggleRow
          icon="vibrate"
          label="Vibración"
          hint="Vibra al detectar un ave o con oleaje fuerte"
          value={prefs.vibrationFeedback}
          onChange={(v) => updatePreferences({ vibrationFeedback: v })}
        />
        <ToggleRow
          icon="content-save"
          label="Guardar en la bitácora"
          hint="Anota cada ave detectada con más de 70 % de certeza"
          value={prefs.autoSaveDetections}
          onChange={(v) => updatePreferences({ autoSaveDetections: v })}
        />
        <BigButton
          label="Probar Voz del Faro"
          icon="volume-high"
          color="#FFFFFF"
          onPress={() => void speak(`Buenos días, ${user.nickname}. La Voz del Faro está lista para acompañarlo en el mar.`)}
          compact
        />
      </Card>

      <Card>
        <Title icon="chip">Acerca del modelo</Title>
        <Body>
          Edge Impulse #{classifier.project?.id ?? 1134969} · {classifier.project?.name ?? 'Faro_Pesquero_IA'} · versión{' '}
          {classifier.project?.deploy_version ?? 3}
        </Body>
        <Body>
          Reconoce piquero, pelícano, gaviota y ruido del mar con 1 segundo de audio a 16 kHz. Corre dentro del celular, sin
          internet.
        </Body>
        <Body color={c.faint} size={13}>
          Sensores: micrófono, acelerómetro, giroscopio, barómetro, magnetómetro, GPS y vibración.
        </Body>
      </Card>

      <BigButton label="Restablecer datos de demo" icon="restore" color={c.surfaceAlt} textColor={c.warning} onPress={confirmReset} compact />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  input: { minHeight: 56, borderRadius: 14, borderWidth: 2, paddingHorizontal: 14 },
});
