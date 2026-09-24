import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { useTripsStore } from '../store/tripsStore';
import ProgressRing from '../components/ProgressRing';
import TripListItem from '../components/TripListItem';

const MAX_DAYS = 90;

export default function DashboardScreen() {
    const navigation = useNavigation<any>();
    const trips = useTripsStore((s) => s.trips);
    const getCompliance = useTripsStore((s) => s.getCompliance);
    const getExitDeadline = useTripsStore((s) => s.getExitDeadline);

    const compliance = useMemo(() => getCompliance('schengen'), [trips]);
    const exitDeadline = useMemo(() => getExitDeadline('schengen'), [trips]);

    const recentTrips = useMemo(() => {
        return [...trips]
            .filter((t) => t.zoneId === 'schengen')
            .sort((a, b) => dayjs(b.entryDate).valueOf() - dayjs(a.entryDate).valueOf())
            .slice(0, 2);
    }, [trips]);

    const statusInfo = getStatusInfo(compliance.daysUsed, MAX_DAYS, compliance.isViolation);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="menu" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.zoneBadge}>
                        <Text style={styles.zoneBadgeText}>🇪🇺 Шенгенская зона</Text>
                    </View>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Progress Ring */}
                <View style={styles.ringWrapper}>
                    <ProgressRing daysUsed={compliance.daysUsed} maxDays={MAX_DAYS} />
                </View>

                {/* Status card */}
                <View style={[styles.statusCard, { borderColor: statusInfo.color + '55' }]}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>{statusInfo.title}</Text>
                            <Text style={styles.statusSubtitle}>
                                Осталось {compliance.daysRemaining} {daysWord(compliance.daysRemaining)} в этом окне
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Exit deadline */}
                {exitDeadline && (
                    <View style={styles.deadlineCard}>
                        <Ionicons name="warning" size={18} color="#F59E0B" />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.deadlineLabel}>СЛЕДУЮЩИЙ ДЕДЛАЙН ВЫЕЗДА</Text>
                            <Text style={styles.deadlineDate}>{formatDateRu(exitDeadline)}</Text>
                        </View>
                    </View>
                )}

                {/* Recent trips */}
                <View style={styles.recentHeader}>
                    <Text style={styles.recentTitle}>Последние поездки</Text>
                    <TouchableOpacity>
                        <Text style={styles.recentAll}>Все →</Text>
                    </TouchableOpacity>
                </View>

                {recentTrips.length === 0 ? (
                    <Text style={styles.emptyText}>Поездок пока нет — добавь первую</Text>
                ) : (
                    recentTrips.map((trip) => <TripListItem key={trip.id} trip={trip} />)
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddTrip')}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

function getStatusInfo(daysUsed: number, maxDays: number, isViolation: boolean) {
    if (isViolation) return { color: '#EF4444', title: 'Превышен лимит' };
    const ratio = daysUsed / maxDays;
    if (ratio >= 0.78) return { color: '#F59E0B', title: 'Приближается лимит' };
    return { color: '#22C55E', title: 'Всё в порядке' };
}

function daysWord(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
}

function formatDateRu(dateStr: string): string {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    const d = dayjs(dateStr);
    return `${d.date()} ${months[d.month()]} ${d.year()}`;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    iconButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#161616',
        justifyContent: 'center', alignItems: 'center',
    },
    zoneBadge: {
        backgroundColor: '#161616',
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20,
    },
    zoneBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    ringWrapper: { alignItems: 'center', marginVertical: 32 },
    statusCard: {
        flexDirection: 'row',
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    statusTitle: { fontSize: 15, fontWeight: '700' },
    statusSubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    deadlineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: '#F59E0B33',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    deadlineLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    deadlineDate: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 2 },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recentTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    recentAll: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
    emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 20 },
    fab: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#3B82F6',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
});