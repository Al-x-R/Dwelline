import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { useJourneysStore } from '../store/journeysStore';
import { useTripsStore } from '../store/tripsStore';
import type { Journey } from '../types/Journey';
import type { Trip } from '../types/Trip';
import { daysWord } from '../utils/format';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const journeys = useJourneysStore((s) => s.journeys);
  const trips = useTripsStore((s) => s.trips);

  const sortedJourneys = useMemo(() => {
    return [...journeys].sort(
      (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );
  }, [journeys]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>История поездок</Text>

      <FlatList
        data={sortedJourneys}
        keyExtractor={(item: Journey) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Поездок пока нет</Text>}
        renderItem={({item}: { item: Journey }) => {
          const journeyTrips = trips.filter((t: Trip) => item.tripIds.includes(t.id));
          return (
            <JourneyRow
              journey={item}
              trips={journeyTrips}
              onPress={() => navigation.navigate('JourneyDetail', {journeyId: item.id})}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}

function JourneyRow({journey, trips, onPress}: {
  journey: Journey;
  trips: Trip[];
  onPress: () => void;
}) {
  if (trips.length === 0) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress}>
        <Text style={styles.flag}>🏳️</Text>
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.name}>{journey.name}</Text>
          <Text style={styles.dates}>Нет данных по маршруту</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#4B5563"/>
      </TouchableOpacity>
    );
  }

  const sorted = [...trips].sort(
    (a, b) => dayjs(a.entryDate).valueOf() - dayjs(b.entryDate).valueOf()
  );
  const firstEntry = sorted[0].entryDate;
  const last = sorted[sorted.length - 1];
  const isOpen = last.exitDate === null;
  const lastDate = last.exitDate ?? dayjs().format('YYYY-MM-DD');
  const totalDays = Math.max(1, dayjs(lastDate).diff(dayjs(firstEntry), 'day') + 1);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.flag}>{journey.originCountryFlag ?? '🧭'}</Text>
      <View style={{flex: 1, marginLeft: 12}}>
        <Text style={styles.name}>{journey.name}</Text>
        <Text style={styles.dates}>
          {dayjs(firstEntry).format('D MMM YYYY')} —{' '}
          {isOpen ? 'сейчас' : dayjs(lastDate).format('D MMM YYYY')}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{totalDays} {daysWord(totalDays)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#4B5563" style={{marginLeft: 8}}/>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0A0A0A'},
  title: {color: '#FFFFFF', fontSize: 22, fontWeight: '700', paddingHorizontal: 20, marginTop: 8, marginBottom: 12},
  listContent: {paddingHorizontal: 20, paddingBottom: 40},
  emptyText: {color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 40},
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F0F0F', borderRadius: 14, padding: 14, marginTop: 10,
  },
  flag: {fontSize: 28},
  name: {color: '#FFFFFF', fontSize: 15, fontWeight: '600'},
  dates: {color: '#9CA3AF', fontSize: 13, marginTop: 2},
  badge: {backgroundColor: '#1F1F1F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10},
  badgeText: {color: '#D1D5DB', fontSize: 12, fontWeight: '600'},
});