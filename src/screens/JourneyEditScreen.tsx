import React, { useState, useEffect, useRef } from 'react';
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
import { ALL_COUNTRIES, findCountryOption, type CountryOption } from '../constants/allCountries';
import { BUILT_IN_ZONES } from '../constants/zones';
import type { Trip, TransportMode } from '../types/Trip';
import WorldCountryPickerModal, { type PickedCountry } from '../components/WorldCountryPickerModal';
import { formatDuration } from '../utils/format';

interface RoutePoint {
  id: string;
  country: CountryOption | null;
  date: Date | null;
  transportMode?: TransportMode;
  arrivalTime?: string;
  departureTime?: string;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function toStartOfDay(date: Date | null | undefined): Date | undefined {
  if (!date) return undefined;
  return dayjs(date).startOf('day').toDate();
}

function parseTime(value?: string): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function legMinutes(dep?: string, arr?: string): number | null {
  const d = parseTime(dep);
  const a = parseTime(arr);
  if (d === null || a === null) return null;
  let diff = a - d;
  if (diff < 0) diff += 24 * 60;
  return diff === 0 ? null : diff;
}

const TRANSPORT_OPTIONS: { mode: TransportMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  {mode: 'plane', icon: 'airplane-outline'},
  {mode: 'car', icon: 'car-outline'},
  {mode: 'bus', icon: 'bus-outline'},
  {mode: 'train', icon: 'train-outline'},
  {mode: 'ferry', icon: 'boat-outline'},
  {mode: 'walk', icon: 'walk-outline'},
];

const TRANSPORT_ICON_BY_MODE: Record<TransportMode, keyof typeof Ionicons.glyphMap> = {
  plane: 'airplane', car: 'car', bus: 'bus', train: 'train', ferry: 'boat', walk: 'walk', other: 'navigate',
};

function TransportPicker({
  value,
  onChange,
}: {
  value?: TransportMode;
  onChange: (mode?: TransportMode) => void;
}) {
  return (
    <View style={styles.transportRow}>
      {TRANSPORT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.mode}
          style={[styles.transportChip, value === opt.mode && styles.transportChipActive]}
          onPress={() => onChange(value === opt.mode ? undefined : opt.mode)}
        >
          <Ionicons name={opt.icon} size={16} color={value === opt.mode ? '#FFFFFF' : '#9CA3AF'}/>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function JourneyEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const journeyId: string = route.params?.journeyId;

  const journey = useJourneysStore((s) => s.getJourney(journeyId));
  const updateJourney = useJourneysStore((s) => s.updateJourney);
  const allTrips = useTripsStore((s) => s.trips);
  const addTrips = useTripsStore((s) => s.addTrips);
  const deleteTrip = useTripsStore((s) => s.deleteTrip);

  const originalTrips = React.useMemo(() => {
    if (!journey) return [];
    return allTrips
      .filter((t) => journey.tripIds.includes(t.id))
      .sort((a, b) => dayjs(a.entryDate).valueOf() - dayjs(b.entryDate).valueOf());
  }, [allTrips, journey]);

  const initializedRef = useRef(false);

  const [journeyName, setJourneyName] = useState('');
  const [originCountry, setOriginCountry] = useState<PickedCountry | null>(null);
  const [originModalVisible, setOriginModalVisible] = useState(false);
  const [originDepartureTime, setOriginDepartureTime] = useState('');
  const [originTransportMode, setOriginTransportMode] = useState<TransportMode | undefined>(undefined);

  const [points, setPoints] = useState<RoutePoint[]>([{id: makeId(), country: null, date: null}]);
  const [turnaroundIndex, setTurnaroundIndex] = useState<number | null>(null);

  const [destinationCountry, setDestinationCountry] = useState<PickedCountry | null>(null);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [finalExitDate, setFinalExitDate] = useState<Date | null>(null);
  const [destinationArrivalTime, setDestinationArrivalTime] = useState('');

  const [countryModalIndex, setCountryModalIndex] = useState<number | null>(null);
  const [dateModalIndex, setDateModalIndex] = useState<number | null>(null); // -1 = дата выезда в конечную точку
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!journey || initializedRef.current) return;
    const trips = allTrips
      .filter((t) => journey.tripIds.includes(t.id))
      .sort((a, b) => dayjs(a.entryDate).valueOf() - dayjs(b.entryDate).valueOf());
    if (journey.tripIds.length > 0 && trips.length === 0) return;

    initializedRef.current = true;

    setJourneyName(journey.name ?? '');

    if (journey.originCountryName) {
      setOriginCountry({name: journey.originCountryName, flag: journey.originCountryFlag ?? '🏳️'});
    }
    setOriginDepartureTime(journey.originDepartureTime ?? '');
    setOriginTransportMode((journey.originTransportMode as TransportMode) ?? undefined);

    if (trips.length > 0) {
      setPoints(
        trips.map((t) => ({
          id: t.id,
          country: findCountryOption(t.countryCode) ?? null,
          date: new Date(t.entryDate),
          transportMode: t.transportMode,
          arrivalTime: t.arrivalTime,
          departureTime: t.departureTime,
        }))
      );

      if (journey.turnaroundTripId) {
        const idx = trips.findIndex((t) => t.id === journey.turnaroundTripId);
        if (idx >= 0) setTurnaroundIndex(idx);
      }
    }

    if (journey.destinationCountryName) {
      setDestinationCountry({name: journey.destinationCountryName, flag: journey.destinationCountryFlag ?? '🏳️'});
    }
    setDestinationArrivalTime(journey.destinationArrivalTime ?? '');

    const lastTripExit = trips[trips.length - 1]?.exitDate ?? null;
    if (lastTripExit) setFinalExitDate(new Date(lastTripExit));
  }, [journey, allTrips]);

  const implementedZones = BUILT_IN_ZONES.filter((z) => z.isImplemented);
  const filteredCountries =
    zoneFilter === 'all' ? ALL_COUNTRIES : ALL_COUNTRIES.filter((c) => c.zoneId === zoneFilter);

  const updatePoint = (index: number, updates: Partial<RoutePoint>) => {
    setPoints((prev) => prev.map((p, i) => (i === index ? {...p, ...updates} : p)));
  };

  const addPoint = () => {
    setPoints((prev) => [...prev, {id: makeId(), country: null, date: null}]);
  };

  const removePoint = (index: number) => {
    if (points.length === 1) return;
    setPoints((prev) => prev.filter((_, i) => i !== index));
    if (turnaroundIndex !== null) {
      if (index < turnaroundIndex) setTurnaroundIndex(turnaroundIndex - 1);
      else if (index === turnaroundIndex) setTurnaroundIndex(null);
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
    if (dateModalIndex === -1) setFinalExitDate(chosen);
    else updatePoint(dateModalIndex, {date: chosen});
    setDateModalIndex(null);
  };

  const getMinDate = (): Date | undefined => {
    if (dateModalIndex === null) return undefined;
    if (dateModalIndex === -1) return toStartOfDay(points[points.length - 1]?.date);
    if (dateModalIndex === 0) return undefined;
    return toStartOfDay(points[dateModalIndex - 1].date);
  };

  const handleZoneChipPress = (zone: (typeof BUILT_IN_ZONES)[number]) => {
    if (!zone.isMultiCountry) {
      const country = ALL_COUNTRIES.find((c) => c.zoneId === zone.id);
      if (country && countryModalIndex !== null) updatePoint(countryModalIndex, {country});
      setCountryModalIndex(null);
      setZoneFilter('all');
    } else {
      setZoneFilter(zone.id);
    }
  };

  const handleSave = async () => {
    if (!isPointsValid || !journey) return;

    const lastPointDate = points[points.length - 1].date;
    if (finalExitDate && lastPointDate && dayjs(finalExitDate).isBefore(dayjs(lastPointDate), 'day')) {
      Alert.alert('Некорректная дата', 'Дата выезда не может быть раньше даты прибытия в последнюю точку.');
      return;
    }

    setSaving(true);

    const newTrips: Trip[] = points.map((point, index) => {
      const isLast = index === points.length - 1;
      const exitDate = isLast
        ? finalExitDate
          ? dayjs(finalExitDate).format('YYYY-MM-DD')
          : null
        : dayjs(points[index + 1].date).format('YYYY-MM-DD');

      return {
        id: point.id,
        zoneId: point.country!.zoneId,
        countryCode: point.country!.code,
        entryDate: dayjs(point.date).format('YYYY-MM-DD'),
        exitDate,
        transportMode: point.transportMode,
        arrivalTime: point.arrivalTime,
        departureTime: point.departureTime,
      };
    });

    for (const t of originalTrips) {
      await deleteTrip(t.id);
    }
    await addTrips(newTrips);

    await updateJourney(journey.id, {
      name: journeyName.trim() || journey.name,
      originCountryName: originCountry?.name ?? null,
      originCountryFlag: originCountry?.flag ?? null,
      originDepartureTime: originDepartureTime.trim() || null,
      originTransportMode: originTransportMode ?? null,
      destinationCountryName: destinationCountry?.name ?? null,
      destinationCountryFlag: destinationCountry?.flag ?? null,
      destinationArrivalTime: destinationArrivalTime.trim() || null,
      turnaroundTripId: turnaroundIndex !== null ? newTrips[turnaroundIndex]?.id ?? null : null,
      tripIds: newTrips.map((t) => t.id),
    });

    setSaving(false);
    navigation.goBack();
  };

  if (!journey) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Поездка не найдена</Text>
      </SafeAreaView>
    );
  }

  type VisualNode = { label: string; transport?: TransportMode };
  const visualNodes: VisualNode[] = [];
  if (originCountry) {
    visualNodes.push({label: `${originCountry.flag} ${originCountry.name}`, transport: originTransportMode});
  }
  points.forEach((p) =>
    visualNodes.push({
      label: p.country ? `${p.country.flag} ${p.country.name}` : '···',
      transport: p.transportMode,
    })
  );
  if (destinationCountry) {
    visualNodes.push({label: `${destinationCountry.flag} ${destinationCountry.name}`});
  }

  interface Leg {
    minutes: number | null;
    isReturn: boolean
  }

  const legs: Leg[] = [];

  const originLegMinutes = originCountry ? legMinutes(originDepartureTime, points[0]?.arrivalTime) : null;
  if (originCountry) legs.push({minutes: originLegMinutes, isReturn: false});

  const pointLegMinutes: (number | null)[] = points.map((p, i) => {
    if (i < points.length - 1) return legMinutes(p.departureTime, points[i + 1].arrivalTime);
    return destinationCountry ? legMinutes(p.departureTime, destinationArrivalTime) : null;
  });
  points.forEach((_, i) => {
    const hasLeg = i < points.length - 1 || !!destinationCountry;
    if (hasLeg) {
      legs.push({minutes: pointLegMinutes[i], isReturn: turnaroundIndex !== null && i >= turnaroundIndex});
    }
  });

  const knownLegs = legs.filter((l): l is { minutes: number; isReturn: boolean } => l.minutes !== null);
  const sum = (items: { minutes: number }[]) => items.reduce((acc, l) => acc + l.minutes, 0);
  const outboundKnown = knownLegs.filter((l) => !l.isReturn);
  const inboundKnown = knownLegs.filter((l) => l.isReturn);
  const hasMissingLegs = legs.some((l) => l.minutes === null);
  const fmtGroup = (items: { minutes: number }[]) => (items.length ? formatDuration(sum(items)) : '—');

  const returnDivider = (
    <View style={styles.sectionDivider}>
      <View style={styles.sectionDividerLine}/>
      <Text style={styles.sectionDividerText}>Обратный маршрут</Text>
      <View style={styles.sectionDividerLine}/>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Отмена</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Редактировать поездку</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {visualNodes.length > 1 && (
          <View style={styles.routeVisual}>
            {visualNodes.map((node, i) => (
              <View key={i} style={styles.routeVisualItem}>
                <View style={styles.routeVisualNode}>
                  <View style={styles.routeVisualDot}/>
                  {i < visualNodes.length - 1 && (
                    <View style={styles.routeVisualLine}>
                      {node.transport ? (
                        <View style={styles.routeVisualIconWrap}>
                          <Ionicons name={TRANSPORT_ICON_BY_MODE[node.transport]} size={10} color="#FFFFFF"/>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
                <Text style={styles.routeVisualLabel} numberOfLines={1}>{node.label}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.fieldLabel}>НАЗВАНИЕ ПОЕЗДКИ</Text>
        <TextInput
          style={styles.nameInput}
          value={journeyName}
          onChangeText={setJourneyName}
          placeholder="Название"
          placeholderTextColor="#6B7280"
        />

        <Text style={styles.fieldLabel}>ОТКУДА СТАРТОВАЛ (НЕОБЯЗАТЕЛЬНО)</Text>
        <TouchableOpacity style={styles.select} onPress={() => setOriginModalVisible(true)}>
          <Text style={originCountry ? styles.selectValue : styles.selectPlaceholder}>
            {originCountry ? `${originCountry.flag} ${originCountry.name}` : 'Не указано'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6B7280"/>
        </TouchableOpacity>

        {originCountry && (
          <>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Время отправления</Text>
                <TextInput
                  style={styles.timeInput}
                  value={originDepartureTime}
                  onChangeText={setOriginDepartureTime}
                  placeholder="чч:мм"
                  placeholderTextColor="#6B7280"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Text style={styles.innerLabel}>СРЕДСТВО ДО ПЕРВОЙ ТОЧКИ</Text>
            <TransportPicker value={originTransportMode} onChange={setOriginTransportMode}/>
            {originLegMinutes !== null && (
              <Text style={styles.legDuration}>В пути до первой точки: {formatDuration(originLegMinutes)}</Text>
            )}
          </>
        )}

        {points.map((point, index) => {
          const isLast = index === points.length - 1;
          const hasOutgoing = !isLast || !!destinationCountry;
          const legToNext = pointLegMinutes[index];
          return (
            <React.Fragment key={point.id}>
              {turnaroundIndex !== null && index === turnaroundIndex + 1 && returnDivider}

              <View style={styles.pointCard}>
                <View style={styles.pointHeader}>
                  <Text style={styles.pointLabel}>Точка {index + 1}</Text>
                  {points.length > 1 && (
                    <TouchableOpacity onPress={() => removePoint(index)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444"/>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.pointRow}>
                  <TouchableOpacity style={styles.pointCountrySelect} onPress={() => setCountryModalIndex(index)}>
                    <Text style={point.country ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
                      {point.country ? `${point.country.flag} ${point.country.name}` : 'Страна'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.pointDateSelect} onPress={() => openDatePicker(index)}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280"/>
                    <Text style={point.date ? styles.selectValueSmall : styles.selectPlaceholderSmall}>
                      {point.date ? dayjs(point.date).format('DD.MM.YY') : 'Дата'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.timeLabel}>Прибыл сюда</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={point.arrivalTime ?? ''}
                      onChangeText={(text) => updatePoint(index, {arrivalTime: text})}
                      placeholder="чч:мм"
                      placeholderTextColor="#6B7280"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  {hasOutgoing && (
                    <View style={styles.timeField}>
                      <Text style={styles.timeLabel}>Уехал отсюда</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={point.departureTime ?? ''}
                        onChangeText={(text) => updatePoint(index, {departureTime: text})}
                        placeholder="чч:мм"
                        placeholderTextColor="#6B7280"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  )}
                </View>

                {hasOutgoing ? (
                  <>
                    <Text style={styles.innerLabel}>
                      {isLast ? 'СРЕДСТВО ДО КОНЕЧНОЙ ТОЧКИ' : 'СРЕДСТВО ДО СЛЕДУЮЩЕЙ ТОЧКИ'}
                    </Text>
                    <TransportPicker
                      value={point.transportMode}
                      onChange={(mode) => updatePoint(index, {transportMode: mode})}
                    />
                    {legToNext !== null && (
                      <Text style={styles.legDuration}>
                        В пути до {isLast ? 'конечной' : 'следующей'} точки: {formatDuration(legToNext)}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={styles.turnaroundRow}
                      onPress={() => setTurnaroundIndex(turnaroundIndex === index ? null : index)}
                    >
                      <Ionicons
                        name={turnaroundIndex === index ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={turnaroundIndex === index ? '#3B82F6' : '#6B7280'}
                      />
                      <Text style={styles.turnaroundText}>Отсюда начинается обратный путь</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.hintText}>
                    Чтобы указать время выезда и транспорт, выбери конечную точку ниже
                  </Text>
                )}
              </View>
            </React.Fragment>
          );
        })}

        <TouchableOpacity style={styles.addPointButton} onPress={addPoint}>
          <Ionicons name="add-circle-outline" size={20} color="#3B82F6"/>
          <Text style={styles.addPointText}>Добавить точку</Text>
        </TouchableOpacity>

        {turnaroundIndex !== null && turnaroundIndex === points.length - 1 && returnDivider}

        <Text style={styles.fieldLabel}>
          КУДА ВЫЕЗЖАЕШЬ
          ИЗ {points[points.length - 1]?.country?.name?.toUpperCase() ?? 'ПОСЛЕДНЕЙ ТОЧКИ'} (НЕОБЯЗАТЕЛЬНО)
        </Text>
        <View style={styles.pointRow}>
          <TouchableOpacity style={styles.pointCountrySelectWide} onPress={() => setDestinationModalVisible(true)}>
            <Text style={destinationCountry ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
              {destinationCountry ? `${destinationCountry.flag} ${destinationCountry.name}` : 'Место'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pointDateSelect} onPress={() => openDatePicker(-1)}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280"/>
            <Text style={finalExitDate ? styles.selectValueSmall : styles.selectPlaceholderSmall}>
              {finalExitDate ? dayjs(finalExitDate).format('DD.MM.YY') : 'Дата'}
            </Text>
          </TouchableOpacity>
        </View>

        {destinationCountry && (
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Время прибытия</Text>
              <TextInput
                style={styles.timeInput}
                value={destinationArrivalTime}
                onChangeText={setDestinationArrivalTime}
                placeholder="чч:мм"
                placeholderTextColor="#6B7280"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        )}

        {(destinationCountry || finalExitDate) && (
          <TouchableOpacity
            onPress={() => {
              setDestinationCountry(null);
              setFinalExitDate(null);
              setDestinationArrivalTime('');
            }}
          >
            <Text style={styles.clearText}>Убрать — оставить точку открытой</Text>
          </TouchableOpacity>
        )}

        {knownLegs.length > 0 && (
          <View style={styles.summaryBlock}>
            {turnaroundIndex !== null ? (
              <>
                <Text style={styles.totalDuration}>Время в пути туда: {fmtGroup(outboundKnown)}</Text>
                <Text style={styles.totalDuration}>Время в пути обратно: {fmtGroup(inboundKnown)}</Text>
                <Text style={[styles.totalDuration, styles.totalDurationBold]}>
                  Всего в пути: {formatDuration(sum(knownLegs))}
                </Text>
              </>
            ) : (
              <Text style={[styles.totalDuration, styles.totalDurationBold]}>
                Всего в пути: {formatDuration(sum(knownLegs))}
              </Text>
            )}
            {hasMissingLegs && (
              <Text style={styles.summaryHint}>Учтены только перегоны, где указаны оба времени</Text>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, (!isPointsValid || saving) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!isPointsValid || saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Сохраняю…' : 'Сохранить изменения'}</Text>
      </TouchableOpacity>

      <WorldCountryPickerModal visible={originModalVisible} onSelect={setOriginCountry}
                               onClose={() => setOriginModalVisible(false)}/>
      <WorldCountryPickerModal visible={destinationModalVisible} onSelect={setDestinationCountry}
                               onClose={() => setDestinationModalVisible(false)}/>

      <Modal visible={countryModalIndex !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выбери страну</Text>
            <View style={styles.zoneFilterRow}>
              <TouchableOpacity style={[styles.zoneChip, zoneFilter === 'all' && styles.zoneChipActive]}
                                onPress={() => setZoneFilter('all')}>
                <Text style={[styles.zoneChipText, zoneFilter === 'all' && styles.zoneChipTextActive]}>Все</Text>
              </TouchableOpacity>
              {implementedZones.map((zone) => (
                <TouchableOpacity key={zone.id}
                                  style={[styles.zoneChip, zoneFilter === zone.id && styles.zoneChipActive]}
                                  onPress={() => handleZoneChipPress(zone)}>
                  <Text
                    style={[styles.zoneChipText, zoneFilter === zone.id && styles.zoneChipTextActive]}>{zone.flag} {zone.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              style={{maxHeight: 350}}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    if (countryModalIndex !== null) updatePoint(countryModalIndex, {country: item});
                    setCountryModalIndex(null);
                    setZoneFilter('all');
                  }}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => {
              setCountryModalIndex(null);
              setZoneFilter('all');
            }}>
              <Text style={styles.modalCloseText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={dateModalIndex !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{dateModalIndex === -1 ? 'Дата выезда' : 'Дата прибытия'}</Text>
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
  container: {flex: 1, backgroundColor: '#0A0A0A', paddingHorizontal: 20},
  header: {marginTop: 8, marginBottom: 8},
  backText: {color: '#9CA3AF', fontSize: 16},
  headerTitle: {color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 8},
  scrollContent: {paddingBottom: 20},
  fieldLabel: {color: '#6B7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 16},
  nameInput: {
    backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, color: '#FFFFFF', fontSize: 15,
  },
  routeVisual: {flexDirection: 'row', paddingVertical: 16, marginTop: 8},
  routeVisualItem: {flex: 1, alignItems: 'center'},
  routeVisualNode: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 14},
  routeVisualDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', zIndex: 2},
  routeVisualLine: {
    position: 'absolute', left: '50%', right: '-50%', top: 6, height: 2,
    backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'visible',
  },
  routeVisualIconWrap: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  routeVisualLabel: {color: '#9CA3AF', fontSize: 10, marginTop: 6, textAlign: 'center'},
  sectionDivider: {flexDirection: 'row', alignItems: 'center', marginVertical: 16},
  sectionDividerLine: {flex: 1, height: 1, backgroundColor: '#1F1F1F'},
  sectionDividerText: {color: '#6B7280', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginHorizontal: 10},
  pointCard: {backgroundColor: '#0F0F0F', borderRadius: 16, padding: 14, marginTop: 10},
  pointHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  pointLabel: {color: '#9CA3AF', fontSize: 13, fontWeight: '700'},
  pointRow: {flexDirection: 'row', gap: 8},
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
  selectValueSmall: {color: '#FFFFFF', fontSize: 14, marginLeft: 6},
  selectPlaceholderSmall: {color: '#6B7280', fontSize: 14, marginLeft: 6},
  select: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#161616', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  selectValue: {color: '#FFFFFF', fontSize: 15},
  selectPlaceholder: {color: '#6B7280', fontSize: 15},
  transportRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4},
  transportChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center'
  },
  transportChipActive: {backgroundColor: '#3B82F6'},
  addPointButton: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14},
  addPointText: {color: '#3B82F6', fontSize: 15, fontWeight: '600', marginLeft: 8},
  clearText: {color: '#3B82F6', fontSize: 13, marginTop: 8, textAlign: 'center'},
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  saveButtonDisabled: {backgroundColor: '#1F1F1F'},
  saveButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  modalOverlay: {flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20},
  modalTitle: {color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16},
  zoneFilterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  zoneChip: {backgroundColor: '#161616', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8},
  zoneChipActive: {backgroundColor: '#3B82F6'},
  zoneChipText: {color: '#9CA3AF', fontSize: 13, fontWeight: '600'},
  zoneChipTextActive: {color: '#FFFFFF'},
  countryRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
  countryFlag: {fontSize: 24, marginRight: 12},
  countryName: {color: '#FFFFFF', fontSize: 16},
  datePickerWrapper: {backgroundColor: '#0F0F0F', borderRadius: 14, overflow: 'hidden'},
  modalClose: {alignItems: 'center', paddingVertical: 16, marginTop: 8},
  modalCloseText: {color: '#3B82F6', fontSize: 15, fontWeight: '600'},
  modalActions: {flexDirection: 'row', justifyContent: 'space-around', marginTop: 8},
  modalActionButton: {paddingVertical: 16, paddingHorizontal: 24},
  modalCancelText: {color: '#6B7280', fontSize: 15, fontWeight: '600'},
  emptyText: {color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 40},
  timeRow: {flexDirection: 'row', gap: 8, marginTop: 8},
  timeField: {flex: 1},
  timeLabel: {color: '#6B7280', fontSize: 10, marginBottom: 4},
  timeInput: {
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13
  },
  innerLabel: {color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 12, marginBottom: 2},
  legDuration: {color: '#3B82F6', fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center'},
  turnaroundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F'
  },
  turnaroundText: {color: '#9CA3AF', fontSize: 13, marginLeft: 8},
  hintText: {color: '#6B7280', fontSize: 12, marginTop: 10, lineHeight: 16},
  summaryBlock: {marginTop: 12, marginBottom: 12},
  totalDuration: {color: '#D1D5DB', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 4},
  totalDurationBold: {color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 4},
  summaryHint: {color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 4},
});