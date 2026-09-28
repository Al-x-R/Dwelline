import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import type { Trip } from '../types/Trip';
import { findCountryOption } from '../constants/allCountries';

interface Props {
    trip: Trip;
}

function daysWord(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
}

export default function TripListItem({ trip }: Props) {
    const country = findCountryOption(trip.countryCode);
    const entry = dayjs(trip.entryDate);
    const exit = trip.exitDate ? dayjs(trip.exitDate) : dayjs();
    const days = exit.diff(entry, 'day') + 1;

    return (
        <View style={styles.item}>
            <Text style={styles.flag}>{country?.flag ?? '🏳️'}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.country}>{country?.name ?? trip.countryCode}</Text>
                <Text style={styles.dates}>
                    {entry.format('D MMM')} — {trip.exitDate ? exit.format('D MMM') : 'сейчас'}
                </Text>
            </View>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{days} {daysWord(days)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    flag: { fontSize: 28 },
    country: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    dates: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    badge: {
        backgroundColor: '#1F1F1F',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 10,
    },
    badgeText: { color: '#D1D5DB', fontSize: 12, fontWeight: '600' },
});