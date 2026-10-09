import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';

import { useJourneysStore } from '../store/journeysStore';
import { useTripsStore } from '../store/tripsStore';
import { BUILT_IN_ZONES } from '../constants/zones';
import { findCountryOption } from '../constants/allCountries';
import { colorForZone } from '../constants/zoneColors';
import { daysWord, tripDays } from '../utils/format';
import type { Trip, TransportMode } from '../types/Trip';
import ZoneProgressBar from '../components/ZoneProgressBar';
import EditTripModal from '../components/EditTripModal';

const ALL_ZONE_IDS = BUILT_IN_ZONES.map((z) => z.id);

const TRANSPORT_ICONS: Record<TransportMode, keyof typeof Ionicons.glyphMap> = {
  plane: 'airplane-outline',
  car: 'car-outline',
  bus: 'bus-outline',
  train: 'train-outline',
  ferry: 'boat-outline',
  walk: 'walk-outline',
  other: 'navigate-outline',
};

export default function JourneyDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const journeyId: string = route.params?.journeyId;

  const journey = useJourneysStore((s) => s.getJourney(journeyId));
  const updateJourney = useJourneysStore((s) => s.updateJourney);
  const deleteJourney = useJourneysStore((s) => s.deleteJourney);

  const allTrips = useTripsStore((s) => s.trips);
  const updateTrip = useTripsStore((s) => s.updateTrip);
  const deleteTrip = useTripsStore((s) => s.deleteTrip);
  const getCompliance = useTripsStore((s) => s.getCompliance);

  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [name, setName] = useState(journey?.name ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const trips = useMemo(() => {
    if (!journey) return [];
    return allTrips
      .filter((t) => journey.tripIds.includes(t.id))
      .sort((a, b) => dayjs(a.entryDate).valueOf() - dayjs(b.entryDate).valueOf());
  }, [allTrips, journey]);

  const journeyDaysByZone = useMemo(() => {
    const byZone = new Map<string, number>();
    trips.forEach((t) => {
      const days = tripDays(t.entryDate, t.exitDate);
      byZone.set(t.zoneId, (byZone.get(t.zoneId) ?? 0) + days);
    });
    return byZone;
  }, [trips]);

  const touchedZoneIds = useMemo(() => {
    return Array.from(new Set(trips.map((t) => t.zoneId)));
  }, [trips]);

  const totalDays = useMemo(() => {
    if (trips.length === 0) return 0;
    const first = trips[0].entryDate;
    const last = trips[trips.length - 1];
    const lastDate = last.exitDate ?? dayjs().format('YYYY-MM-DD');
    return Math.max(1, dayjs(lastDate).diff(dayjs(first), 'day') + 1);
  }, [trips]);

  const handleRename = async () => {
    if (!journey) return;
    const trimmed = name.trim();
    if (trimmed && trimmed !== journey.name) {
      await updateJourney(journey.id, {name: trimmed});
    }
  };

  const handleDeleteJourney = () => {
    Alert.alert('Удалить всю поездку?', 'Будут удалены все отрезки маршрута. Это действие нельзя отменить.', [
      {text: 'Отмена', style: 'cancel'},
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          for (const t of trips) {
            await deleteTrip(t.id);
          }
          await deleteJourney(journeyId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!journey) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Поездка не найдена</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF"/>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.doneText}>Готово</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => navigation.navigate('JourneyEdit', {journeyId})}
                hitSlop={8}
                style={{marginRight: 20}}
              >
                <Ionicons name="pencil-outline" size={22} color="#9CA3AF"/>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteJourney} hitSlop={8}>
                <Ionicons name="trash-outline" size={22} color="#EF4444"/>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            onBlur={handleRename}
            placeholder="Название поездки"
            placeholderTextColor="#6B7280"
          />
        ) : (
          <Text style={styles.nameText}>{journey.name}</Text>
        )}

        {journey.originCountryName && (
          <Text style={styles.originText}>
            {journey.originCountryFlag} Старт: {journey.originCountryName}
          </Text>
        )}

        {trips.length === 0 ? (
          <Text style={styles.emptyText}>Все отрезки маршрута удалены</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Статус по зонам</Text>
            {touchedZoneIds.map((zoneId) => {
              const zone = BUILT_IN_ZONES.find((z) => z.id === zoneId);
              const compliance = getCompliance(zoneId);
              return (
                <ZoneProgressBar
                  key={zoneId}
                  flag={zone?.flag ?? '🏳️'}
                  name={zone?.name ?? zoneId}
                  daysUsed={compliance.daysUsed}
                  maxDays={zone?.maxStayDays ?? 90}
                  daysInJourney={journeyDaysByZone.get(zoneId) ?? 0}
                  color={colorForZone(zoneId, ALL_ZONE_IDS)}
                />
              );
            })}

            <Text style={styles.sectionTitle}>Отрезки маршрута · {totalDays} {daysWord(totalDays)} всего</Text>
            {trips.map((trip) => {
              const country = findCountryOption(trip.countryCode);
              const days = tripDays(trip.entryDate, trip.exitDate);
              return (
                <View key={trip.id} style={styles.tripRow}>
                  <Text style={styles.tripFlag}>{country?.flag ?? '🏳️'}</Text>
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.tripCountry}>{country?.name ?? trip.countryCode}</Text>
                    <Text style={styles.tripDates}>
                      {dayjs(trip.entryDate).format('D MMM')} —{' '}
                      {trip.exitDate ? dayjs(trip.exitDate).format('D MMM') : 'сейчас'}
                    </Text>
                  </View>
                  <Text style={styles.tripDaysText}>{days} {daysWord(days)}</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={async (updates) => {
            await updateTrip(editingTrip.id, updates);
            setEditingTrip(null);
          }}
          onDelete={async () => {
            await deleteTrip(editingTrip.id);
            setEditingTrip(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0A0A0A'},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8,
  },
  headerActions: {flexDirection: 'row', alignItems: 'center'},
  doneText: {color: '#3B82F6', fontSize: 16, fontWeight: '600'},
  scrollContent: {paddingHorizontal: 20, paddingBottom: 40},
  nameText: {color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 12},
  nameInput: {
    color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 12,
    borderBottomWidth: 1, borderBottomColor: '#1F1F1F', paddingVertical: 6,
  },
  originText: {color: '#6B7280', fontSize: 13, marginTop: 10, marginBottom: 20},
  sectionTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 8},
  tripRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F0F0F', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  tripFlag: {fontSize: 22},
  tripCountry: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
  tripDates: {color: '#9CA3AF', fontSize: 12, marginTop: 2},
  tripTime: {color: '#6B7280', fontSize: 12},
  tripDaysText: {color: '#D1D5DB', fontSize: 13, fontWeight: '600'},
  emptyText: {color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 40},
});