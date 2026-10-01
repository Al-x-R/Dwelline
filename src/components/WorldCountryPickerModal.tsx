import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WORLD_COUNTRIES, countryCodeToFlag, type WorldCountry } from '../constants/worldCountries';

export interface PickedCountry {
    name: string;
    flag: string;
}

interface Props {
    visible: boolean;
    onSelect: (country: PickedCountry) => void;
    onClose: () => void;
}

export default function WorldCountryPickerModal({ visible, onSelect, onClose }: Props) {
    const [query, setQuery] = useState('');
    const [manualMode, setManualMode] = useState(false);
    const [manualName, setManualName] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return WORLD_COUNTRIES;
        return WORLD_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
    }, [query]);

    const close = () => {
        setQuery('');
        setManualMode(false);
        setManualName('');
        onClose();
    };

    const pick = (country: WorldCountry) => {
        onSelect({ name: country.name, flag: countryCodeToFlag(country.code) });
        close();
    };

    const confirmManual = () => {
        const name = manualName.trim();
        if (!name) return;
        onSelect({ name, flag: '🏳️' });
        close();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{manualMode ? 'Ввести вручную' : 'Выбери страну'}</Text>
                        <TouchableOpacity onPress={close} hitSlop={8}>
                            <Ionicons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {manualMode ? (
                        <>
                            <TextInput
                                style={styles.manualInput}
                                placeholder="Название страны или места"
                                placeholderTextColor="#6B7280"
                                value={manualName}
                                onChangeText={setManualName}
                                autoFocus
                            />
                            <TouchableOpacity
                                style={[styles.confirmButton, !manualName.trim() && styles.confirmButtonDisabled]}
                                onPress={confirmManual}
                                disabled={!manualName.trim()}
                            >
                                <Text style={styles.confirmButtonText}>Готово</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setManualMode(false)}>
                                <Text style={styles.backToListText}>← Вернуться к списку стран</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.searchRow}>
                                <Ionicons name="search" size={18} color="#6B7280" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Поиск страны..."
                                    placeholderTextColor="#6B7280"
                                    value={query}
                                    onChangeText={setQuery}
                                />
                            </View>

                            <FlatList
                                data={filtered}
                                keyExtractor={(item: WorldCountry) => item.code}
                                style={{ maxHeight: 360 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }: { item: WorldCountry }) => (
                                    <TouchableOpacity style={styles.row} onPress={() => pick(item)}>
                                        <Text style={styles.flag}>{countryCodeToFlag(item.code)}</Text>
                                        <Text style={styles.name}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>Ничего не найдено</Text>
                                }
                            />

                            <TouchableOpacity style={styles.manualButton} onPress={() => setManualMode(true)}>
                                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                                <Text style={styles.manualButtonText}>Не нашёл — ввести вручную</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    content: { backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
    },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, marginLeft: 8, padding: 0 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    flag: { fontSize: 24, marginRight: 12 },
    name: { color: '#FFFFFF', fontSize: 16 },
    emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 24 },
    manualButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: '#1F1F1F',
    },
    manualButtonText: { color: '#3B82F6', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    manualInput: {
        backgroundColor: '#161616', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
        color: '#FFFFFF', fontSize: 15, marginBottom: 16,
    },
    confirmButton: { backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    confirmButtonDisabled: { backgroundColor: '#1F1F1F' },
    confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    backToListText: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 16 },
});