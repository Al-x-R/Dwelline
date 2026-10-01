import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useTripsStore } from '../store/tripsStore';
import { BUILT_IN_ZONES } from '../constants/zones';
import { findCountryOption, type CountryOption } from '../constants/allCountries';
import type { Trip } from '../types/Trip';
import { daysWord, tripDays, toStartOfDay } from '../utils/format';
import CountryPickerModal from '../components/CountryPickerModal';
import DatePickerModal from '../components/DatePickerModal';

const IMPLEMENTED_ZONES = BUILT_IN_ZONES.filter((z) => z.isImplemented);

export default function HistoryScreen() {
    const trips = useTripsStore((s) => s.trips);
    const updateTrip = useTripsStore((s) => s.updateTrip);
    const deleteTrip = useTripsStore((s) => s.deleteTrip);

    const [zoneFilter, setZoneFilter] = useState<string>('all');
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

    const filteredTrips = useMemo(() => {
        const list = zoneFilter === 'all' ? trips : trips.filter((t) => t.zoneId === zoneFilter);
        return [...list].sort((a, b) => dayjs(b.entryDate).valueOf() - dayjs(a.entryDate).valueOf());
    }, [trips, zoneFilter]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Text style={styles.title}>История поездок</Text>

            <View style={styles.chipsRow}>
                <TouchableOpacity
                    style={[styles.chip, zoneFilter === 'all' && styles.chipActive]}
                    onPress={() => setZoneFilter('all')}
                >
                    <Text style={[styles.chipText, zoneFilter === 'all' && styles.chipTextActive]}>Все</Text>
                </TouchableOpacity>
                {IMPLEMENTED_ZONES.map((zone) => (
                    <TouchableOpacity
                        key={zone.id}
                        style={[styles.chip, zoneFilter === zone.id && styles.chipActive]}
                        onPress={() => setZoneFilter(zone.id)}
                    >
                        <Text style={[styles.chipText, zoneFilter === zone.id && styles.chipTextActive]}>
                            {zone.flag} {zone.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTrips}
                keyExtractor={(item: Trip) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>Поездок пока нет</Text>}
                renderItem={({ item }: { item: Trip }) => (
                    <TripRow trip={item} onPress={() => setEditingTrip(item)} />
                )}
            />

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

function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
    const country = findCountryOption(trip.countryCode);
    const days = tripDays(trip.entryDate, trip.exitDate);

    return (
        <TouchableOpacity style={styles.row} onPress={onPress}>
            <Text style={styles.flag}>{country?.flag ?? '🏳️'}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.country}>{country?.name ?? trip.countryCode}</Text>
                <Text style={styles.dates}>
                    {dayjs(trip.entryDate).format('D MMM YYYY')} —{' '}
                    {trip.exitDate ? dayjs(trip.exitDate).format('D MMM YYYY') : 'сейчас'}
                </Text>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{days} {daysWord(days)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4B5563" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
}

interface EditTripModalProps {
    trip: Trip;
    onClose: () => void;
    onSave: (updates: Partial<Trip>) => void;
    onDelete: () => void;
}

function EditTripModal({ trip, onClose, onSave, onDelete }: EditTripModalProps) {
    const [country, setCountry] = useState<CountryOption | null>(
        findCountryOption(trip.countryCode) ?? null
    );
    const [entryDate, setEntryDate] = useState<Date>(new Date(trip.entryDate));
    const [exitDate, setExitDate] = useState<Date | null>(
        trip.exitDate ? new Date(trip.exitDate) : null
    );

    const [countryModalVisible, setCountryModalVisible] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState<'entry' | 'exit' | null>(null);

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
        });
    };

    const handleDelete = () => {
        Alert.alert('Удалить поездку?', 'Это действие нельзя отменить.', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: onDelete },
        ]);
    };

    return (
        <Modal visible animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.editOverlay}>
                <View style={styles.editContent}>
                    <View style={styles.editHeader}>
                        <Text style={styles.editTitle}>Редактировать поездку</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={8}>
                            <Ionicons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.fieldLabel}>СТРАНА</Text>
                    <TouchableOpacity style={styles.select} onPress={() => setCountryModalVisible(true)}>
                        <Text style={country ? styles.selectValue : styles.selectPlaceholder}>
                            {country ? `${country.flag} ${country.name}` : 'Выбрать страну'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>ВЪЕЗД</Text>
                    <TouchableOpacity style={styles.select} onPress={() => setDatePickerTarget('entry')}>
                        <Text style={styles.selectValue}>{dayjs(entryDate).format('DD.MM.YYYY')}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>ВЫЕЗД</Text>
                    <TouchableOpacity style={styles.select} onPress={() => setDatePickerTarget('exit')}>
                        <Text style={exitDate ? styles.selectValue : styles.selectPlaceholder}>
                            {exitDate ? dayjs(exitDate).format('DD.MM.YYYY') : 'Открыта — я ещё там'}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                    {exitDate && (
                        <TouchableOpacity onPress={() => setExitDate(null)}>
                            <Text style={styles.clearText}>Убрать дату — оставить открытой</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!isValid}
                    >
                        <Text style={styles.saveButtonText}>Сохранить</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={styles.deleteText}>Удалить поездку</Text>
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
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', paddingHorizontal: 20, marginTop: 8 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
    chip: { backgroundColor: '#161616', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipActive: { backgroundColor: '#3B82F6' },
    chipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF' },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 40 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F0F0F', borderRadius: 14, padding: 14, marginTop: 10 },
    flag: { fontSize: 28 },
    country: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    dates: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    badge: { backgroundColor: '#1F1F1F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    badgeText: { color: '#D1D5DB', fontSize: 12, fontWeight: '600' },
    editOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    editContent: { backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    editTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    fieldLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
    select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
    selectValue: { color: '#FFFFFF', fontSize: 15 },
    selectPlaceholder: { color: '#6B7280', fontSize: 15 },
    clearText: { color: '#3B82F6', fontSize: 13, marginTop: 8, textAlign: 'center' },
    saveButton: { backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    saveButtonDisabled: { backgroundColor: '#1F1F1F' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600', marginLeft: 8 },
});