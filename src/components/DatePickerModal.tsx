import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

interface Props {
    visible: boolean;
    title: string;
    initialDate: Date | null;
    minimumDate?: Date;
    maximumDate?: Date;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
}

export default function DatePickerModal({
                                            visible,
                                            title,
                                            initialDate,
                                            minimumDate,
                                            maximumDate,
                                            onConfirm,
                                            onCancel,
                                        }: Props) {
    const [draft, setDraft] = useState<Date>(initialDate ?? new Date());

    useEffect(() => {
        if (visible) setDraft(initialDate ?? new Date());
    }, [visible, initialDate]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.pickerWrapper}>
                        <DateTimePicker
                            value={draft}
                            mode="date"
                            display="inline"
                            themeVariant="dark"
                            accentColor="#3B82F6"
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            onValueChange={(_event: unknown, date: Date) => setDraft(date)}
                        />
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
                            <Text style={styles.cancelText}>Отмена</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onConfirm(dayjs(draft).startOf('day').toDate())}
                        >
                            <Text style={styles.confirmText}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
    content: { backgroundColor: '#0F0F0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    pickerWrapper: { backgroundColor: '#0F0F0F', borderRadius: 14, overflow: 'hidden' },
    actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    actionButton: { paddingVertical: 16, paddingHorizontal: 24 },
    cancelText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
    confirmText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
});