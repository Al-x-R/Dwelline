import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { useTripsStore } from '../store/tripsStore';
import { SCHENGEN_COUNTRIES, type Country } from '../constants/countries';
import type { ZoneId } from '../types/Trip';

type PickerTarget = 'entry' | 'exit' | null;

export default function AddTripScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const addTrip = useTripsStore((s) => s.addTrip);

    // Экран переиспользуется и в онбординге, и из FAB — зона передаётся параметром,
    // по умолчанию Шенген, раз в MVP это единственная рабочая зона
    const zoneId: ZoneId = route.params?.zoneId ?? 'schengen';
    const onDone: (() => void) | undefined = route.params?.onDone;

    const [country, setCountry] = useState<Country | null>(null);
    const [entryDate, setEntryDate] = useState<Date | null>(null);
    const [exitDate, setExitDate] = useState<Date | null>(null);
    const [stillThere, setStillThere] = useState(false);

    const [countryModalVisible, setCountryModalVisible] = useState(false);
    const [activePicker, setActivePicker] = useState<PickerTarget>(null);

    const isValid = country && entryDate && (stillThere || exitDate);

    const handleSave = async () => {
        if (!isValid || !country) return;

        await addTrip({
            zoneId,
            countryCode: country.code,
            entryDate: dayjs(entryDate).format('YYYY-MM-DD'),
            exitDate: stillThere ? null : dayjs(exitDate).format('YYYY-MM-DD'),
        });

        if (onDone) {
            onDone();
        } else {
            navigation.goBack();
        }
    };

    const handleSkip = () => {
        if (onDone) onDone();
        else navigation.goBack();
    };

    const openPicker = (target: 'entry' | 'exit') => {
        if (target === 'entry' && !entryDate) setEntryDate(new Date());
        if (target === 'exit' && !exitDate) setExitDate(new Date());
        setActivePicker(target);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Назад</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Добавь свою последнюю поездку</Text>
            <Text style={styles.subtitle}>(или пропусти и добавь позже)</Text>

            <View style={styles.form}>
                {/* Страна */}
                <Text style={styles.fieldLabel}>СТРАНА</Text>
                <TouchableOpacity style={styles.select} onPress={() => setCountryModalVisible(true)}>
                    <Text style={country ? styles.selectValue : styles.selectPlaceholder}>
                        {country ? `${country.flag} ${country.name}` : 'Выбрать страну'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </TouchableOpacity>

                {/* Въезд */}
                <Text style={styles.fieldLabel}>ВЪЕЗД</Text>
                <TouchableOpacity style={styles.select} onPress={() => openPicker('entry')}>
                    <Text style={entryDate ? styles.selectValue : styles.selectPlaceholder}>
                        {entryDate ? dayjs(entryDate).format('DD.MM.YYYY') : 'ДД.ММ.ГГГГ'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                </TouchableOpacity>

                {/* Выезд */}
                <Text style={styles.fieldLabel}>ВЫЕЗД</Text>
                <TouchableOpacity
                    style={[styles.select, stillThere && styles.selectDisabled]}
                    onPress={() => !stillThere && openPicker('exit')}
                    disabled={stillThere}
                >
                    <Text style={exitDate && !stillThere ? styles.selectValue : styles.selectPlaceholder}>
                        {stillThere ? '—' : exitDate ? dayjs(exitDate).format('DD.MM.YYYY') : 'ДД.ММ.ГГГГ'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                </TouchableOpacity>

                {/* Я всё ещё там */}
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setStillThere(!stillThere)}>
                    <View style={[styles.checkbox, stillThere && styles.checkboxChecked]}>
                        {stillThere && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>Я всё ещё там</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!isValid}
            >
                <Text style={styles.saveButtonText}>Добавить поездку</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Пропустить →</Text>
            </TouchableOpacity>

            {/* Модалка выбора страны */}
            <Modal visible={countryModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Выбери страну</Text>
                        <FlatList
                            data={SCHENGEN_COUNTRIES}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.countryRow}
                                    onPress={() => {
                                        setCountry(item);
                                        setCountryModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.countryFlag}>{item.flag}</Text>
                                    <Text style={styles.countryName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalClose} onPress={() => setCountryModalVisible(false)}>
                            <Text style={styles.modalCloseText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date picker */}
            <Modal visible={activePicker !== null} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {activePicker === 'entry' ? 'Дата въезда' : 'Дата выезда'}
                        </Text>
                        {activePicker && (
                            <View style={styles.datePickerWrapper}>
                                <DateTimePicker
                                    value={(activePicker === 'entry' ? entryDate : exitDate) ?? new Date()}
                                    mode="date"
                                    display="inline"
                                    themeVariant="dark"
                                    accentColor="#3B82F6"
                                    maximumDate={activePicker === 'entry' ? new Date() : undefined}
                                    minimumDate={activePicker === 'exit' && entryDate ? entryDate : undefined}
                                    onChange={(_event, selectedDate) => {
                                        if (!selectedDate) return;
                                        if (activePicker === 'entry') setEntryDate(selectedDate);
                                        else setExitDate(selectedDate);
                                    }}
                                />
                            </View>
                        )}
                        <TouchableOpacity style={styles.modalClose} onPress={() => setActivePicker(null)}>
                            <Text style={styles.modalCloseText}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 20 },
    header: { marginTop: 8 },
    backText: { color: '#9CA3AF', fontSize: 16 },
    title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 24, textAlign: 'center' },
    subtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 6 },
    form: { marginTop: 32 },
    fieldLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
    select: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: '#1F1F1F',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    selectDisabled: { opacity: 0.4 },
    selectValue: { color: '#FFFFFF', fontSize: 15 },
    selectPlaceholder: { color: '#6B7280', fontSize: 15 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
    checkbox: {
        width: 20, height: 20, borderRadius: 5,
        borderWidth: 1.5, borderColor: '#4B5563',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    checkboxLabel: { color: '#D1D5DB', fontSize: 15 },
    saveButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    saveButtonDisabled: { backgroundColor: '#1F1F1F' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    skipButton: { alignItems: 'center', marginTop: 16 },
    skipText: { color: '#6B7280', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#0F0F0F',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    countryFlag: { fontSize: 24, marginRight: 12 },
    countryName: { color: '#FFFFFF', fontSize: 16 },
    modalClose: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
    modalCloseText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
    datePickerWrapper: {
        backgroundColor: '#0F0F0F',
        borderRadius: 14,
        overflow: 'hidden',
    },
});