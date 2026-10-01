import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ALL_COUNTRIES, type CountryOption } from '../constants/allCountries';
import { BUILT_IN_ZONES, type ZoneConfig } from '../constants/zones';

interface Props {
    visible: boolean;
    onSelect: (country: CountryOption) => void;
    onClose: () => void;
}

const IMPLEMENTED_ZONES = BUILT_IN_ZONES.filter((z) => z.isImplemented);

export default function CountryPickerModal({ visible, onSelect, onClose }: Props) {
    const [zoneFilter, setZoneFilter] = useState<string>('all');

    const countries =
        zoneFilter === 'all' ? ALL_COUNTRIES : ALL_COUNTRIES.filter((c) => c.zoneId === zoneFilter);

    const finish = (country: CountryOption) => {
        setZoneFilter('all');
        onSelect(country);
    };

    const close = () => {
        setZoneFilter('all');
        onClose();
    };

    const handleZonePress = (zone: ZoneConfig) => {
        if (!zone.isMultiCountry) {
            const country = ALL_COUNTRIES.find((c) => c.zoneId === zone.id);
            if (country) finish(country);
        } else {
            setZoneFilter(zone.id);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Выбери страну</Text>

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
                                onPress={() => handleZonePress(zone)}
                            >
                                <Text style={[styles.chipText, zoneFilter === zone.id && styles.chipTextActive]}>
                                    {zone.flag} {zone.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        data={countries}
                        keyExtractor={(item: CountryOption) => item.code}
                        style={{ maxHeight: 350 }}
                        renderItem={({ item }: { item: CountryOption }) => (
                            <TouchableOpacity style={styles.row} onPress={() => finish(item)}>
                                <Text style={styles.flag}>{item.flag}</Text>
                                <Text style={styles.name}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />

                    <TouchableOpacity style={styles.close} onPress={close}>
                        <Text style={styles.closeText}>Закрыть</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    content: { backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { backgroundColor: '#161616', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipActive: { backgroundColor: '#3B82F6' },
    chipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    flag: { fontSize: 24, marginRight: 12 },
    name: { color: '#FFFFFF', fontSize: 16 },
    close: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
    closeText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
});