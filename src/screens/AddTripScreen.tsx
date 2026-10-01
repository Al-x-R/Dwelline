import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    ScrollView,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { useTripsStore } from '../store/tripsStore';
import { useJourneysStore } from '../store/journeysStore';
import { ALL_COUNTRIES, type CountryOption } from '../constants/allCountries';
import { BUILT_IN_ZONES } from '../constants/zones';
import type { Trip } from '../types/Trip';
import WorldCountryPickerModal, { type PickedCountry } from '../components/WorldCountryPickerModal';

interface RoutePoint {
    id: string;
    country: CountryOption | null;
    date: Date | null;
}

function makeId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeEmptyPoint(): RoutePoint {
    return { id: makeId(), country: null, date: null };
}

function toStartOfDay(date: Date | null | undefined): Date | undefined {
    if (!date) return undefined;
    return dayjs(date).startOf('day').toDate();
}

export default function AddTripScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const addTrips = useTripsStore((s) => s.addTrips);
    const addJourney = useJourneysStore((s) => s.addJourney);
    const onDone: (() => void) | undefined = route.params?.onDone;

    const [originCountry, setOriginCountry] = useState<PickedCountry | null>(null);
    const [originModalVisible, setOriginModalVisible] = useState(false);

    const [destinationCountry, setDestinationCountry] = useState<PickedCountry | null>(null);
    const [destinationModalVisible, setDestinationModalVisible] = useState(false);

    const [journeyName, setJourneyName] = useState('');
    const [nameEditedManually, setNameEditedManually] = useState(false);

    const [points, setPoints] = useState<RoutePoint[]>([makeEmptyPoint()]);
    const [returnStartIndex, setReturnStartIndex] = useState<number | null>(null);

    const [countryModalIndex, setCountryModalIndex] = useState<number | null>(null);
    const [dateModalIndex, setDateModalIndex] = useState<number | null>(null);
    const [draftDate, setDraftDate] = useState<Date>(new Date());
    const [zoneFilter, setZoneFilter] = useState<string>('all');
    const [saved, setSaved] = useState(false);

    const [finalExitDate, setFinalExitDate] = useState<Date | null>(null);

    const implementedZones = BUILT_IN_ZONES.filter((z) => z.isImplemented);

    const filteredCountries =
        zoneFilter === 'all' ? ALL_COUNTRIES : ALL_COUNTRIES.filter((c) => c.zoneId === zoneFilter);

    useEffect(() => {
        if (nameEditedManually) return;
        const from = originCountry?.name ?? points[0]?.country?.name;
        const to = destinationCountry?.name ?? points[points.length - 1]?.country?.name;
        if (from && to && from !== to) {
            setJourneyName(`${from} — ${to}`);
        } else if (to) {
            setJourneyName(to);
        }
    }, [originCountry, destinationCountry, points, nameEditedManually]);

    const updatePoint = (index: number, updates: Partial<RoutePoint>) => {
        setPoints((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
    };

    const addPoint = () => {
        setPoints((prev) => [...prev, makeEmptyPoint()]);
    };

    const addReturnRoute = () => {
        if (returnStartIndex === null) {
            setReturnStartIndex(points.length);
        }
        addPoint();
    };

    const removePoint = (index: number) => {
        if (points.length === 1) return;
        setPoints((prev) => prev.filter((_, i) => i !== index));
        if (returnStartIndex !== null && index < returnStartIndex) {
            setReturnStartIndex((prev) => (prev !== null ? prev - 1 : prev));
        } else if (returnStartIndex === index) {
            setReturnStartIndex(null);
        }
    };

    const isPointsValid = points.every((p) => p.country && p.date);

    const openDatePicker = (index: number) => {
        const existing = index === -1 ? finalExitDate : points[index].date;
        setDraftDate(existing ?? new Date());
        setDateModalIndex(index);
    };

    const confirmDate = () => {
        if (dateModalIndex === null) return;
        const chosen = dayjs(draftDate).startOf('day').toDate();
        if (dateModalIndex === -1) {
            setFinalExitDate(chosen);
        } else {
            updatePoint(dateModalIndex, { date: chosen });
        }
        setDateModalIndex(null);
    };

    const getMinDate = (): Date | undefined => {
        if (dateModalIndex === null) return undefined;
        if (dateModalIndex === -1) return toStartOfDay(points[points.length - 1]?.date);
        if (dateModalIndex === 0) return undefined;
        return toStartOfDay(points[dateModalIndex - 1].date);
    };

    const buildTripsFromPoints = (): Trip[] => {
        return points.map((point, index) => {
            const isLast = index === points.length - 1;
            const exitDate = isLast
                ? finalExitDate
                    ? dayjs(finalExitDate).format('YYYY-MM-DD')
                    : null
                : dayjs(points[index + 1].date).format('YYYY-MM-DD');

            return {
                id: makeId(),
                zoneId: point.country!.zoneId,
                countryCode: point.country!.code,
                entryDate: dayjs(point.date).format('YYYY-MM-DD'),
                exitDate,
            };
        });
    };

    const handleSave = async () => {
        if (!isPointsValid) return;

        const lastPointDate = points[points.length - 1].date;
        if (finalExitDate && lastPointDate && dayjs(finalExitDate).isBefore(dayjs(lastPointDate), 'day')) {
            Alert.alert(
                'Некорректная дата',
                'Дата выезда не может быть раньше даты прибытия в последнюю точку.'
            );
            return;
        }

        const trips = buildTripsFromPoints();
        await addTrips(trips);

        await addJourney({
            name: journeyName.trim() || 'Поездка',
            originCountryName: originCountry?.name ?? null,
            originCountryFlag: originCountry?.flag ?? null,
            tripIds: trips.map((t) => t.id),
        });

        setSaved(true);
        setTimeout(() => {
            if (onDone) onDone();
            else navigation.goBack();
        }, 700);
    };

    const handleSkip = () => {
        if (onDone) onDone();
        else navigation.goBack();
    };

    const handleZoneChipPress = (zone: (typeof BUILT_IN_ZONES)[number]) => {
        if (!zone.isMultiCountry) {
            const country = ALL_COUNTRIES.find((c) => c.zoneId === zone.id);
            if (country && countryModalIndex !== null) {
                updatePoint(countryModalIndex, { country });
            }
            setCountryModalIndex(null);
            setZoneFilter('all');
        } else {
            setZoneFilter(zone.id);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Назад</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Маршрут поездки</Text>
                <Text style={styles.subtitle}>
                    Добавь все точки маршрута — приложение само посчитает дни по каждой зоне
                </Text>

                <Text style={styles.fieldLabel}>ОТКУДА СТАРТОВАЛ (НЕОБЯЗАТЕЛЬНО)</Text>
                <TouchableOpacity style={styles.select} onPress={() => setOriginModalVisible(true)}>
                    <Text style={originCountry ? styles.selectValue : styles.selectPlaceholder}>
                        {originCountry ? `${originCountry.flag} ${originCountry.name}` : 'Не указано'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </TouchableOpacity>
                {originCountry && (
                    <TouchableOpacity onPress={() => setOriginCountry(null)}>
                        <Text style={styles.clearText}>Убрать точку отправления</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>НАЗВАНИЕ ПОЕЗДКИ</Text>
                <TextInput
                    style={styles.nameInput}
                    value={journeyName}
                    onChangeText={(text) => {
                        setJourneyName(text);
                        setNameEditedManually(true);
                    }}
                    placeholder="Например, Украина — Кипр"
                    placeholderTextColor="#6B7280"
                />

                {points.some((p) => p.country) && (
                    <View style={styles.routeVisual}>
                        {points.map((point, index) => (
                            <View key={point.id} style={styles.routeVisualItem}>
                                <View style={styles.routeVisualNode}>
                                    <View style={styles.routeVisualDot} />
                                    {index < points.length - 1 && <View style={styles.routeVisualLine} />}
                                </View>
                                <Text style={styles.routeVisualLabel} numberOfLines={1}>
                                    {point.country ? `${point.country.flag} ${point.country.name}` : '···'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {points.map((point, index) => (
                    <React.Fragment key={point.id}>
                        {returnStartIndex === index && (
                            <View style={styles.sectionDivider}>
                                <View style={styles.sectionDividerLine} />
                                <Text style={styles.sectionDividerText}>Обратный маршрут</Text>
                                <View style={styles.sectionDividerLine} />
                            </View>
                        )}

                        <View style={styles.pointCard}>
                            <View style={styles.pointHeader}>
                                <Text style={styles.pointLabel}>Точка {index + 1}</Text>
                                {points.length > 1 && (
                                    <TouchableOpacity onPress={() => removePoint(index)} hitSlop={8}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.pointRow}>
                                <TouchableOpacity
                                    style={styles.pointCountrySelect}
                                    onPress={() => setCountryModalIndex(index)}
                                >
                                    <Text
                                        style={point.country ? styles.selectValue : styles.selectPlaceholder}
                                        numberOfLines={1}
                                    >
                                        {point.country ? `${point.country.flag} ${point.country.name}` : 'Страна'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.pointDateSelect}
                                    onPress={() => openDatePicker(index)}
                                >
                                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                                    <Text style={point.date ? styles.selectValueSmall : styles.selectPlaceholderSmall}>
                                        {point.date ? dayjs(point.date).format('DD.MM.YY') : 'Дата'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </React.Fragment>
                ))}

                <TouchableOpacity style={styles.addPointButton} onPress={addPoint}>
                    <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.addPointText}>Добавить следующую точку</Text>
                </TouchableOpacity>

                {returnStartIndex === null && (
                    <TouchableOpacity style={styles.addReturnButton} onPress={addReturnRoute}>
                        <Ionicons name="arrow-undo-outline" size={18} color="#9CA3AF" />
                        <Text style={styles.addReturnText}>Добавить обратный маршрут</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>
                    КУДА ВЫЕЗЖАЕШЬ ИЗ {points[points.length - 1].country?.name?.toUpperCase() ?? 'ПОСЛЕДНЕЙ ТОЧКИ'} (НЕОБЯЗАТЕЛЬНО)
                </Text>
                <Text style={styles.finalExitHint}>
                    Заполни, если точно знаешь — например, летишь домой или в страну, которую пока не
                    отслеживаешь. Это закроет последнюю точку маршрута этой датой.
                </Text>

                <View style={styles.pointRow}>
                    <TouchableOpacity
                        style={styles.pointCountrySelectWide}
                        onPress={() => setDestinationModalVisible(true)}
                    >
                        <Text
                            style={destinationCountry ? styles.selectValue : styles.selectPlaceholder}
                            numberOfLines={1}
                        >
                            {destinationCountry ? `${destinationCountry.flag} ${destinationCountry.name}` : 'Место'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.pointDateSelect} onPress={() => openDatePicker(-1)}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={finalExitDate ? styles.selectValueSmall : styles.selectPlaceholderSmall}>
                            {finalExitDate ? dayjs(finalExitDate).format('DD.MM.YY') : 'Дата'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {(destinationCountry || finalExitDate) && (
                    <TouchableOpacity
                        onPress={() => {
                            setDestinationCountry(null);
                            setFinalExitDate(null);
                        }}
                    >
                        <Text style={styles.clearText}>Убрать — оставить точку открытой</Text>
                    </TouchableOpacity>
                )}

                {!destinationCountry && !finalExitDate && (
                    <Text style={styles.openEndedHint}>
                        Последняя точка маршрута останется открытой («я всё ещё там»), пока не добавишь
                        следующую поездку или не укажешь конечную точку выше.
                    </Text>
                )}
            </ScrollView>

            <TouchableOpacity
                style={[styles.saveButton, (!isPointsValid || saved) && styles.saveButtonDisabled, saved && styles.saveButtonSaved]}
                onPress={handleSave}
                disabled={!isPointsValid || saved}
            >
                <Text style={styles.saveButtonText}>{saved ? '✓ Сохранено' : 'Сохранить маршрут'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Пропустить →</Text>
            </TouchableOpacity>

            <WorldCountryPickerModal
                visible={originModalVisible}
                onSelect={setOriginCountry}
                onClose={() => setOriginModalVisible(false)}
            />

            <WorldCountryPickerModal
                visible={destinationModalVisible}
                onSelect={setDestinationCountry}
                onClose={() => setDestinationModalVisible(false)}
            />

            <Modal visible={countryModalIndex !== null} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Выбери страну</Text>

                        <View style={styles.zoneFilterRow}>
                            <TouchableOpacity
                                style={[styles.zoneChip, zoneFilter === 'all' && styles.zoneChipActive]}
                                onPress={() => setZoneFilter('all')}
                            >
                                <Text style={[styles.zoneChipText, zoneFilter === 'all' && styles.zoneChipTextActive]}>
                                    Все
                                </Text>
                            </TouchableOpacity>
                            {implementedZones.map((zone) => (
                                <TouchableOpacity
                                    key={zone.id}
                                    style={[styles.zoneChip, zoneFilter === zone.id && styles.zoneChipActive]}
                                    onPress={() => handleZoneChipPress(zone)}
                                >
                                    <Text style={[styles.zoneChipText, zoneFilter === zone.id && styles.zoneChipTextActive]}>
                                        {zone.flag} {zone.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            style={{ maxHeight: 350 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.countryRow}
                                    onPress={() => {
                                        if (countryModalIndex !== null) {
                                            updatePoint(countryModalIndex, { country: item });
                                        }
                                        setCountryModalIndex(null);
                                        setZoneFilter('all');
                                    }}
                                >
                                    <Text style={styles.countryFlag}>{item.flag}</Text>
                                    <Text style={styles.countryName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => {
                                setCountryModalIndex(null);
                                setZoneFilter('all');
                            }}
                        >
                            <Text style={styles.modalCloseText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={dateModalIndex !== null} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {dateModalIndex === -1 ? 'Дата выезда' : 'Дата прибытия'}
                        </Text>
                        <View style={styles.datePickerWrapper}>
                            <DateTimePicker
                                value={draftDate}
                                mode="date"
                                display="inline"
                                themeVariant="dark"
                                accentColor="#3B82F6"
                                maximumDate={dayjs().endOf('day').toDate()}
                                minimumDate={getMinDate()}
                                onValueChange={(_event, date) => setDraftDate(date)}
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalActionButton} onPress={() => setDateModalIndex(null)}>
                                <Text style={styles.modalCancelText}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalActionButton} onPress={confirmDate}>
                                <Text style={styles.modalCloseText}>Готово</Text>
                            </TouchableOpacity>
                        </View>
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
    scrollContent: { paddingBottom: 20 },
    title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 16, textAlign: 'center' },
    subtitle: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 16 },
    fieldLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    nameInput: {
        backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 14, color: '#FFFFFF', fontSize: 15, marginBottom: 4,
    },
    routeVisual: { flexDirection: 'row', paddingVertical: 16, marginTop: 12, marginBottom: 8 },
    routeVisualItem: { flex: 1, alignItems: 'center' },
    routeVisualNode: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    routeVisualDot: {
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#3B82F6',
        marginLeft: 'auto', marginRight: 'auto',
    },
    routeVisualLine: {
        position: 'absolute', left: '50%', right: '-50%', top: 5, height: 2, backgroundColor: '#3B82F6',
    },
    routeVisualLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 8, textAlign: 'center' },
    sectionDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    sectionDividerLine: { flex: 1, height: 1, backgroundColor: '#1F1F1F' },
    sectionDividerText: { color: '#6B7280', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginHorizontal: 10 },
    pointCard: { backgroundColor: '#0F0F0F', borderRadius: 16, padding: 14, marginBottom: 10 },
    pointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    pointLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
    pointRow: { flexDirection: 'row', gap: 8 },
    pointCountrySelect: {
        flex: 3, backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, justifyContent: 'center',
    },
    pointCountrySelectWide: {
        flex: 3, backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, justifyContent: 'center',
    },
    pointDateSelect: {
        flex: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616',
        borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14,
    },
    selectValueSmall: { color: '#FFFFFF', fontSize: 14, marginLeft: 6 },
    selectPlaceholderSmall: { color: '#6B7280', fontSize: 14, marginLeft: 6 },
    select: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 14,
    },
    selectValue: { color: '#FFFFFF', fontSize: 15 },
    selectPlaceholder: { color: '#6B7280', fontSize: 15 },
    addPointButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    addPointText: { color: '#3B82F6', fontSize: 15, fontWeight: '600', marginLeft: 8 },
    addReturnButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, marginTop: 4, marginBottom: 12,
    },
    addReturnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    openEndedHint: { color: '#4B5563', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 17 },
    finalExitHint: { color: '#6B7280', fontSize: 12, lineHeight: 16, marginBottom: 12 },
    clearText: { color: '#3B82F6', fontSize: 13, marginTop: 8, textAlign: 'center' },
    saveButton: {
        flexDirection: 'row', backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center', marginTop: 16,
    },
    saveButtonDisabled: { backgroundColor: '#1F1F1F' },
    saveButtonSaved: { backgroundColor: '#22C55E' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    skipButton: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
    skipText: { color: '#6B7280', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    zoneFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    zoneChip: { backgroundColor: '#161616', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    zoneChipActive: { backgroundColor: '#3B82F6' },
    zoneChipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    zoneChipTextActive: { color: '#FFFFFF' },
    countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    countryFlag: { fontSize: 24, marginRight: 12 },
    countryName: { color: '#FFFFFF', fontSize: 16 },
    datePickerWrapper: { backgroundColor: '#0F0F0F', borderRadius: 14, overflow: 'hidden' },
    modalClose: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
    modalCloseText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    modalActionButton: { paddingVertical: 16, paddingHorizontal: 24 },
    modalCancelText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
});