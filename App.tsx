import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useTripsStore } from './src/store/tripsStore';
import { useZonesStore } from './src/store/zonesStore';
import { useJourneysStore } from './src/store/journeysStore';

import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ForecastScreen from './src/screens/ForecastScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AddTripScreen from './src/screens/AddTripScreen';
import AddZoneScreen from './src/screens/AddZoneScreen';
import JourneyDetailScreen from './src/screens/JourneyDetailScreen';
import JourneyEditScreen from './src/screens/JourneyEditScreen';

import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Forecast: { zoneId?: string };
  AddTrip: { zoneId?: string; onDone?: () => void };
  AddZone: undefined;
  JourneyDetail: { journeyId: string };
  JourneyEdit: { journeyId: string };
};

export type MainTabsParamList = {
  Home: undefined;
  Calendar: undefined;
  History: undefined;
  Reports: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

const darkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#3B82F6',
    background: '#0A0A0A',
    card: '#0A0A0A',
    text: '#FFFFFF',
    border: '#1F1F1F',
    notification: '#3B82F6',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {backgroundColor: '#0A0A0A', borderTopColor: '#1F1F1F'},
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarIcon: ({color, size}) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Calendar: 'calendar',
            History: 'time',
            Reports: 'bar-chart',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color}/>;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{title: 'Главная'}}/>
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{title: 'Календарь'}}/>
      <Tab.Screen name="History" component={HistoryScreen} options={{title: 'История'}}/>
      <Tab.Screen name="Reports" component={ReportsScreen} options={{title: 'Отчёты'}}/>
    </Tab.Navigator>
  );
}

export default function App() {
  const {loadTrips, isLoaded: tripsLoaded} = useTripsStore();
  const {loadZones, isLoaded: zonesLoaded} = useZonesStore();
  const {loadJourneys, isLoaded: journeysLoaded} = useJourneysStore();

  useEffect(() => {
    loadTrips();
    loadZones();
    loadJourneys();
  }, []);

  if (!tripsLoaded || !zonesLoaded) {
    return null;
  }

  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light"/>
      <RootStack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="MainTabs"
      >
        <RootStack.Screen name="Onboarding" component={OnboardingScreen}/>
        <RootStack.Screen name="MainTabs" component={MainTabs}/>
        <RootStack.Screen
          name="Forecast"
          component={ForecastScreen}
          options={{presentation: 'modal'}}
        />
        <RootStack.Screen
          name="AddTrip"
          component={AddTripScreen}
          options={{presentation: 'modal'}}
        />
        <RootStack.Screen
          name="AddZone"
          component={AddZoneScreen}
          options={{presentation: 'modal'}}
        />
        <RootStack.Screen
          name="JourneyDetail"
          component={JourneyDetailScreen}
          options={{presentation: 'card'}}
        />
        <RootStack.Screen
          name="JourneyEdit"
          component={JourneyEditScreen}
          options={{presentation: 'modal'}}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}