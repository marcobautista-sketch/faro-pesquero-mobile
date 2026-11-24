// Barra de pestañas inferior con las 5 secciones de la app.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import type { IconName } from '../../components/ui';
import { useTheme } from '../../context/AppStore';

const tab = (icon: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialCommunityIcons name={icon} color={color as string} size={size + 4} />;
  };

export default function TabsLayout() {
  const { c, fs } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: fs(12), fontWeight: '800' },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Escuchar', tabBarIcon: tab('radar') }} />
      <Tabs.Screen name="mar" options={{ title: 'Sensores', tabBarIcon: tab('waves') }} />
      <Tabs.Screen name="zonas" options={{ title: 'Zonas', tabBarIcon: tab('compass-outline') }} />
      <Tabs.Screen name="bitacora" options={{ title: 'Bitácora', tabBarIcon: tab('notebook') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: tab('account-circle') }} />
    </Tabs>
  );
}
