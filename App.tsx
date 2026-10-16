import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { useTripsStore } from './src/store/tripsStore';
import { useZonesStore } from './src/store/zonesStore';
import { useJourneysStore } from './src/store/journeysStore';
import { useSettingsStore } from './src/store/settingsStore';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const tripsLoaded = useTripsStore((s) => s.isLoaded);
  const zonesLoaded = useZonesStore((s) => s.isLoaded);
  const journeysLoaded = useJourneysStore((s) => s.isLoaded);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    // Zones first: loading trips moves untracked ones into zones, and custom zones must win there.
    useZonesStore.getState().loadZones().then(() => useTripsStore.getState().loadTrips());
    useJourneysStore.getState().loadJourneys();
  }, []);

  const ready = (fontsLoaded || !!fontError) && tripsLoaded && zonesLoaded && journeysLoaded && settingsHydrated;
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <RootNavigator/>
    </SafeAreaProvider>
  );
}
