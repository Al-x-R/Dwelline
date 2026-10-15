import { useNavigation, type NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  Simulator: { zoneId?: string } | undefined;
  AddTrip: undefined;
  JourneyDetail: { journeyId: string };
  JourneyEdit: { journeyId: string; addSegment?: boolean };
  Settings: undefined;
  Language: undefined;
  Plans: undefined;
  AddZone: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Calendar: undefined;
  History: undefined;
  Reports: undefined;
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function useRootNavigation() {
  return useNavigation<RootNavigation>();
}
