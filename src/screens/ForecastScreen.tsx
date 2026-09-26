import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { useTripsStore } from '../store/tripsStore';
import { simulateTrip, findMaxStayFromDate } from '../core/schengenCalculator';
import { SCHENGEN_COUNTRIES, type Country } from '../constants/countries';

const MAX_DURATION = 150; // намеренно больше 90 — иначе ползунок физически не может показать красную зону
const MAX_VISIBLE_WEEKS = 4; // ограничиваем сетку календаря, чтобы не засорять экран при больших длительностях

export default function ForecastScreen() {
    const navigation = useNavigation<any>();
    const trips = useTripsStore((s) => s.trips);
    const addTrip = useTripsStore((s) => s.addTrip);
    const insets = useSafeAreaInsets();

    const [country, setCountry] = useState<Country | null>(null);
    const [startDate, setStartDate] = useState<Date>(dayjs().add(7, 'day').toDate());
    const [duration, setDuration] = useState(7);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [fullCalendarVisible, setFullCalendarVisible] = useState(false);
    const [countryModalVisible, setCountryModalVisible] = useState(false);
    const [saved, setSaved] = useState(false);

    const simulation = useMemo(() => {
        return simulateTrip(trips, 'schengen', dayjs(startDate).format('YYYY-MM-DD'), duration);
    }, [trips, startDate, duration]);

    // Независимый расчёт максимума — НЕ зависит от duration слайдера,
    // отвечает на отдельный вопрос "а сколько вообще максимум можно с этой даты"
    const maxStayInfo = useMemo(() => {
        return findMaxStayFromDate(trips, 'schengen', dayjs(startDate).format('YYYY-MM-DD'));
    }, [trips, startDate]);

    // Строим сетку дней для календаря-превью — понедельник первым днём недели
    const calendarWeeks = useMemo(() => {
        const weeks: { date: string; daysUsed: number; isViolation: boolean }[][] = [];
        let currentWeek: typeof simulation.dailyStatus = [];

        const firstDay = dayjs(startDate);
        const leadingEmpty = (firstDay.day() + 6) % 7; // сдвиг под понедельник как первый день

        for (let i = 0; i < leadingEmpty; i++) {
            currentWeek.push({ date: '', daysUsed: 0, isViolation: false });
        }

        simulation.dailyStatus.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push({ date: '', daysUsed: 0, isViolation: false });
            weeks.push(currentWeek);
        }

        return weeks;
    }, [simulation, startDate]);

    const visibleWeeks = calendarWeeks.slice(0, MAX_VISIBLE_WEEKS);
    const visibleDaysCount = visibleWeeks.flat().filter((d) => d.date).length;
    const hiddenDaysCount = Math.max(0, duration - visibleDaysCount);

    const monthRangeLabel = useMemo(() => {
        const first = dayjs(startDate);
        const last = dayjs(startDate).add(duration - 1, 'day');
        if (first.isSame(last, 'month')) return formatMonthRu(first.toDate());
        return `${formatMonthRu(first.toDate())} – ${formatMonthRu(last.toDate())}`;
    }, [startDate, duration]);

    const handleSaveAsPlan = async () => {
        if (!country) {
            setCountryModalVisible(true);
            return;
        }
        const exitDate = dayjs(startDate).add(duration - 1, 'day').format('YYYY-MM-DD');
        await addTrip({
            zoneId: 'schengen',
            countryCode: country.code,
            entryDate: dayjs(startDate).format('YYYY-MM-DD'),
            exitDate,
        });
        setSaved(true);
        setTimeout(() => navigation.goBack(), 700);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Назад</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Что если...</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Планируешь поездку?</Text>
                <Text style={styles.subtitle}>Рассчитай допустимый срок пребывания по правилу 90/180</Text>

                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Страна:</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setCountryModalVisible(true)}>
                            {country ? (
                                <Text style={styles.dateButtonText}>{country.flag} {country.name}</Text>
                            ) : (
                                <>
                                    <Ionicons name="flag-outline" size={16} color="#6B7280" />
                                    <Text style={styles.dateButtonPlaceholder}>Выбрать</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Дата начала:</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisible(true)}>
                            <Ionicons name="calendar" size={16} color="#3B82F6" />
                            <Text style={styles.dateButtonText}>{formatDateRu(startDate)}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Длительность:</Text>
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationBadgeText}>{duration} {daysWord(duration)}</Text>
                        </View>
                    </View>

                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={1}
                        maximumValue={MAX_DURATION}
                        step={1}
                        value={duration}
                        onValueChange={setDuration}
                        minimumTrackTintColor="#3B82F6"
                        maximumTrackTintColor="#1F1F1F"
                        thumbTintColor="#3B82F6"
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>Календарь (превью):</Text>
                    <Text style={styles.calendarMonth}>{monthRangeLabel}</Text>
                </View>

                <View style={styles.calendarCard}>
                    <View style={styles.weekDaysRow}>
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                            <Text key={d} style={styles.weekDayLabel}>{d}</Text>
                        ))}
                    </View>
                    {visibleWeeks.map((week, wi) => (
                        <View key={wi} style={styles.weekRow}>
                            {week.map((day, di) => (
                                <View key={di} style={styles.dayCell}>
                                    {day.date ? (
                                        <View style={[styles.dot, { backgroundColor: getDotColor(day.daysUsed, day.isViolation) }]}>
                                            <Text style={styles.dotText}>{dayjs(day.date).date()}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    ))}
                    {hiddenDaysCount > 0 && (
                        <TouchableOpacity onPress={() => setFullCalendarVisible(true)} style={styles.expandRow}>
                            <Text style={styles.moreDaysText}>+ ещё {hiddenDaysCount} {daysWord(hiddenDaysCount)} в поездке</Text>
                            <Text style={styles.expandLink}>Показать весь календарь →</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {simulation.isViolation ? (
                    <View style={styles.violationCard}>
                        <Ionicons name="alert-circle" size={20} color="#EF4444" />
                        <Text style={styles.violationText}>
                            При этих датах — <Text style={styles.violationBold}>превышение на {simulation.maxOverageDays} {daysWord(simulation.maxOverageDays)}</Text>
                        </Text>
                    </View>
                ) : (
                    <View style={styles.okCard}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                        <Text style={styles.okText}>Эти даты полностью укладываются в лимит</Text>
                    </View>
                )}

                {maxStayInfo && (
                    <View style={styles.tipCard}>
                        <Ionicons name="bulb" size={18} color="#F59E0B" />
                        <Text style={styles.tipText}>
                            Максимум можешь остаться до: <Text style={styles.tipBold}>{formatDateRu(dayjs(maxStayInfo.date).toDate())} ({maxStayInfo.days} {daysWord(maxStayInfo.days)})</Text>
                        </Text>
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity
                style={[styles.saveButton, saved && styles.saveButtonSaved]}
                onPress={handleSaveAsPlan}
                disabled={saved}
            >
                <Text style={styles.saveButtonText}>{saved ? '✓ Сохранено' : 'Сохранить как план'}</Text>
            </TouchableOpacity>

            {/* Модалка выбора страны */}
            <Modal visible={countryModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Выбери страну</Text>
                        <FlatList
                            data={SCHENGEN_COUNTRIES}
                            keyExtractor={(item) => item.code}
                            style={{ maxHeight: 400 }}
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

            {/* Date picker для даты начала поездки */}
            <Modal visible={datePickerVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Дата начала поездки</Text>
                        <View style={styles.datePickerWrapper}>
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="inline"
                                themeVariant="dark"
                                accentColor="#3B82F6"
                                minimumDate={new Date()}
                                onChange={(_event, selectedDate) => {
                                    if (selectedDate) setStartDate(selectedDate);
                                }}
                            />
                        </View>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setDatePickerVisible(false)}>
                            <Text style={styles.modalCloseText}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Полноэкранный календарь на всю поездку */}
            <Modal visible={fullCalendarVisible} animationType="slide">
                <View style={[styles.fullCalendarContainer, { paddingTop: insets.top }]}>
                    <View style={styles.fullCalendarHeader}>
                        <Text style={styles.fullCalendarTitle}>Вся поездка · {duration} {daysWord(duration)}</Text>
                        <TouchableOpacity onPress={() => setFullCalendarVisible(false)} hitSlop={12}>
                            <Ionicons name="close" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={[styles.fullCalendarScroll, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.weekDaysRow}>
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                                <Text key={d} style={styles.weekDayLabel}>{d}</Text>
                            ))}
                        </View>
                        {calendarWeeks.map((week, wi) => (
                            <View key={wi} style={styles.weekRow}>
                                {week.map((day, di) => (
                                    <View key={di} style={styles.dayCell}>
                                        {day.date ? (
                                            <View style={[styles.dot, { backgroundColor: getDotColor(day.daysUsed, day.isViolation) }]}>
                                                <Text style={styles.dotText}>{dayjs(day.date).date()}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                ))}
                            </View>
                        ))}

                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                                <Text style={styles.legendText}>Безопасно</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                                <Text style={styles.legendText}>Приближение</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                                <Text style={styles.legendText}>Превышение</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function getDotColor(daysUsed: number, isViolation: boolean): string {
    if (isViolation) return '#EF4444';
    if (daysUsed >= 70) return '#F59E0B';
    return '#22C55E';
}

function daysWord(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
}

function formatDateRu(date: Date): string {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const d = dayjs(date);
    return `${d.date()} ${months[d.month()]} ${d.year()}`;
}

function formatMonthRu(date: Date): string {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const d = dayjs(date);
    return `${months[d.month()]} ${d.year()}`;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    backText: { color: '#9CA3AF', fontSize: 16 },
    headerTitle: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
    title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 20 },
    subtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 6, marginBottom: 20 },
    card: {
        backgroundColor: '#0F0F0F',
        borderRadius: 16,
        padding: 18,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    label: { color: '#D1D5DB', fontSize: 15 },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    dateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    dateButtonPlaceholder: { color: '#6B7280', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    durationBadge: {
        backgroundColor: '#161616',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    durationBadgeText: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#1F1F1F', marginVertical: 24 },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    calendarTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    calendarMonth: { color: '#6B7280', fontSize: 13 },
    calendarCard: {
        backgroundColor: '#0F0F0F',
        borderRadius: 16,
        padding: 14,
    },
    weekDaysRow: { flexDirection: 'row', marginBottom: 8 },
    weekDayLabel: { flex: 1, color: '#6B7280', fontSize: 12, textAlign: 'center', fontWeight: '600' },
    weekRow: { flexDirection: 'row', marginBottom: 4 },
    dayCell: { flex: 1, alignItems: 'center' },
    dot: {
        width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    dotText: { color: '#0A0A0A', fontSize: 10, fontWeight: '700' },
    moreDaysText: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 8 },
    violationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: '#EF444455',
        borderRadius: 14,
        padding: 14,
        marginTop: 16,
    },
    violationText: { color: '#D1D5DB', fontSize: 14, marginLeft: 10, flex: 1 },
    violationBold: { color: '#EF4444', fontWeight: '700' },
    okCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: '#22C55E55',
        borderRadius: 14,
        padding: 14,
        marginTop: 16,
    },
    okText: { color: '#D1D5DB', fontSize: 14, marginLeft: 10 },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
    },
    tipText: { color: '#D1D5DB', fontSize: 14, marginLeft: 10, flex: 1 },
    tipBold: { color: '#F59E0B', fontWeight: '700' },
    saveButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    saveButtonSaved: { backgroundColor: '#22C55E' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#0F0F0F',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    datePickerWrapper: { backgroundColor: '#0F0F0F', borderRadius: 14, overflow: 'hidden' },
    modalClose: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
    modalCloseText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
    countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    countryFlag: { fontSize: 24, marginRight: 12 },
    countryName: { color: '#FFFFFF', fontSize: 16 },
    expandRow: { marginTop: 8, alignItems: 'center' },
    expandLink: { color: '#3B82F6', fontSize: 13, fontWeight: '600', marginTop: 4 },
    fullCalendarContainer: { flex: 1, backgroundColor: '#0A0A0A' },
    fullCalendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F1F',
    },
    fullCalendarTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    fullCalendarScroll: { padding: 20 },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 20,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
    legendText: { color: '#9CA3AF', fontSize: 12 },
});