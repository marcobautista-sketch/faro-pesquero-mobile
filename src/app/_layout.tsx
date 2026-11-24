// Raíz de la app: arma los "proveedores" (estado, GPS y modelo) que comparten todas las pantallas.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStoreProvider } from '../context/AppStore';
import { ClassifierProvider } from '../context/ClassifierContext';
import { LocationProvider } from '../context/LocationContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <LocationProvider>
          <ClassifierProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#040C18' } }} />
          </ClassifierProvider>
        </LocationProvider>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
