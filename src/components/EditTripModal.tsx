import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { findCountryOption, type CountryOption } from '../constants/allCountries';
import type { Trip, TransportMode } from '../types/Trip';
import { toStartOfDay } from '../utils/format';
import CountryPickerModal from './CountryPickerModal';
import DatePickerModal from './DatePickerModal';

interface Props {
  trip: Trip;
  onClose: () => void;
  onSave: (updates: Partial<Trip>) => void;
  onDelete: () => void;
}

const TRANSPORT_OPTIONS: { mode: TransportMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  {mode: 'plane', icon: 'airplane-outline', label: 'Самолёт'},
  {mode: 'car', icon: 'car-outline', label: 'Машина'},
  {mode: 'bus', icon: 'bus-outline', label: 'Автобус'},
  {mode: 'train', icon: 'train-outline', label: 'Поезд'},
  {mode: 'ferry', icon: 'boat-outline', label: 'Паром'},
  {mode: 'walk', icon: 'walk-outline', label: 'Пешком'},
];

export default function EditTripModal({trip, onClose, onSave, onDelete}: Props) {
  const [country, setCountry] = useState<CountryOption | null>(
    findCountryOption(trip.countryCode) ?? null
  );
  const [entryDate, setEntryDate] = useState<Date>(new Date(trip.entryDate));
  const [exitDate, setExitDate] = useState<Date | null>(
    trip.exitDate ? new Date(trip.exitDate) : null
  );

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'entry' | 'exit' | null>(null);

  const [transportMode, setTransportMode] = useState<TransportMode | undefined>(trip.transportMode);
  const [arrivalTime, setArrivalTime] = useState(trip.arrivalTime ?? '');

  const isValid = country !== null;

  const handleSave = () => {
    if (!isValid) return;
    if (exitDate && dayjs(exitDate).isBefore(dayjs(entryDate), 'day')) {
      Alert.alert('Некорректные даты', 'Дата выезда не может быть раньше даты въезда.');
      return;
    }
    onSave({
      zoneId: country!.zoneId,
      countryCode: country!.code,
      entryDate: dayjs(entryDate).format('YYYY-MM-DD'),
      exitDate: exitDate ? dayjs(exitDate).format('YYYY-MM-DD') : null,
      transportMode,
      arrivalTime: arrivalTime.trim() || undefined,
    });
  };

  const handleDelete = () => {
    Alert.alert('Удалить отрезок маршрута?', 'Это действие нельзя отменить.', [
      {text: 'Отмена', style: 'cancel'},
      {text: 'Удалить', style: 'destructive', onPress: onDelete},
    ]);
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Редактировать отрезок</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#9CA3AF"/>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>СТРАНА</Text>
          <TouchableOpacity style={styles.select} onPress={() => setCountryModalVisible(true)}>
            <Text style={country ? styles.selectValue : styles.selectPlaceholder}>
              {country ? `${country.flag} ${country.name}` : 'Выбрать страну'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280"/>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>ВЪЕЗД</Text>
          <TouchableOpacity style={styles.select} onPress={() => setDatePickerTarget('entry')}>
            <Text style={styles.selectValue}>{dayjs(entryDate).format('DD.MM.YYYY')}</Text>
            <Ionicons name="calendar-outline" size={18} color="#6B7280"/>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>ВЫЕЗД</Text>
          <TouchableOpacity style={styles.select} onPress={() => setDatePickerTarget('exit')}>
            <Text style={exitDate ? styles.selectValue : styles.selectPlaceholder}>
              {exitDate ? dayjs(exitDate).format('DD.MM.YYYY') : 'Открыт — я ещё там'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#6B7280"/>
          </TouchableOpacity>
          {exitDate && (
            <TouchableOpacity onPress={() => setExitDate(null)}>
              <Text style={styles.clearText}>Убрать дату — оставить открытым</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.fieldLabel}>КАК ДОБРАЛСЯ (НЕОБЯЗАТЕЛЬНО)</Text>
          <View style={styles.transportRow}>
            {TRANSPORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                style={[styles.transportChip, transportMode === opt.mode && styles.transportChipActive]}
                onPress={() => setTransportMode(transportMode === opt.mode ? undefined : opt.mode)}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={transportMode === opt.mode ? '#FFFFFF' : '#9CA3AF'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>ВРЕМЯ ПРИБЫТИЯ (НЕОБЯЗАТЕЛЬНО)</Text>
          <TextInput
            style={styles.timeInput}
            value={arrivalTime}
            onChangeText={setArrivalTime}
            placeholder="например, 14:30"
            placeholderTextColor="#6B7280"
            keyboardType="numbers-and-punctuation"
          />

          <TouchableOpacity
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.saveButtonText}>Сохранить</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color="#EF4444"/>
            <Text style={styles.deleteText}>Удалить отрезок</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CountryPickerModal
        visible={countryModalVisible}
        onSelect={(c) => {
          setCountry(c);
          setCountryModalVisible(false);
        }}
        onClose={() => setCountryModalVisible(false)}
      />

      <DatePickerModal
        visible={datePickerTarget !== null}
        title={datePickerTarget === 'entry' ? 'Дата въезда' : 'Дата выезда'}
        initialDate={datePickerTarget === 'entry' ? entryDate : exitDate}
        maximumDate={datePickerTarget === 'entry' ? new Date() : undefined}
        minimumDate={datePickerTarget === 'exit' ? toStartOfDay(entryDate) : undefined}
        onCancel={() => setDatePickerTarget(null)}
        onConfirm={(date) => {
          if (datePickerTarget === 'entry') setEntryDate(date);
          else setExitDate(date);
          setDatePickerTarget(null);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end'},
  content: {backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  title: {color: '#FFFFFF', fontSize: 18, fontWeight: '700'},
  fieldLabel: {color: '#6B7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 14},
  select: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  selectValue: {color: '#FFFFFF', fontSize: 15},
  selectPlaceholder: {color: '#6B7280', fontSize: 15},
  clearText: {color: '#3B82F6', fontSize: 13, marginTop: 8, textAlign: 'center'},
  saveButton: {
    backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  saveButtonDisabled: {backgroundColor: '#1F1F1F'},
  saveButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
  },
  deleteText: {color: '#EF4444', fontSize: 14, fontWeight: '600', marginLeft: 8},
  transportRow: {flexDirection: 'row', gap: 8, marginBottom: 4},
  transportChip: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#161616',
    justifyContent: 'center', alignItems: 'center',
  },
  transportChipActive: {backgroundColor: '#3B82F6'},
  timeInput: {
    backgroundColor: '#161616', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    color: '#FFFFFF', fontSize: 15,
  },
});