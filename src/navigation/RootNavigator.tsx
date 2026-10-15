import React, { useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { fonts } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSettingsStore } from '../store/settingsStore';
import { TabBar } from '../components/app/TabBar';
import type { MainTabsParamList, RootStackParamList } from './types';

import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SimulatorScreen from '../screens/SimulatorScreen';
import AddTripScreen from '../screens/AddTripScreen';
import JourneyDetailScreen from '../screens/JourneyDetailScreen';
import JourneyEditScreen from '../screens/JourneyEditScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import PlansScreen from '../screens/PlansScreen';
import AddZoneScreen from '../screens/AddZoneScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{headerShown: false}} tabBar={(props) => <TabBar {...props}/>}>
      <Tab.Screen name="Home" component={DashboardScreen}/>
      <Tab.Screen name="Calendar" component={CalendarScreen}/>
      <Tab.Screen name="History" component={HistoryScreen}/>
      <Tab.Screen name="Reports" component={ReportsScreen}/>
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const theme = useAppTheme();
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);

  const navTheme = useMemo<Theme>(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: theme.dark,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.canvas,
        card: theme.colors.canvas,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.primary,
      },
      fonts: {
        regular: {fontFamily: fonts.regular, fontWeight: '400'},
        medium: {fontFamily: fonts.medium, fontWeight: '500'},
        bold: {fontFamily: fonts.bold, fontWeight: '700'},
        heavy: {fontFamily: fonts.extrabold, fontWeight: '800'},
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={onboardingDone ? 'MainTabs' : 'Onboarding'}
      >
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={{gestureEnabled: false}}/>
        <RootStack.Screen name="MainTabs" component={MainTabs}/>
        <RootStack.Screen name="Simulator" component={SimulatorScreen}/>
        <RootStack.Screen name="AddTrip" component={AddTripScreen} options={{presentation: 'modal'}}/>
        <RootStack.Screen name="JourneyDetail" component={JourneyDetailScreen}/>
        <RootStack.Screen name="JourneyEdit" component={JourneyEditScreen} options={{presentation: 'modal'}}/>
        <RootStack.Screen name="Settings" component={SettingsScreen}/>
        <RootStack.Screen name="Language" component={LanguageScreen}/>
        <RootStack.Screen name="Plans" component={PlansScreen} options={{presentation: 'modal'}}/>
        <RootStack.Screen name="AddZone" component={AddZoneScreen} options={{presentation: 'modal'}}/>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
