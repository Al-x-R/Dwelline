import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { daysWord } from '../utils/format';

interface Props {
  flag: string;
  name: string;
  daysUsed: number;
  maxDays: number;
  daysInJourney: number;
  color: string;
}

export default function ZoneProgressBar({flag, name, daysUsed, maxDays, daysInJourney, color}: Props) {
  const fraction = maxDays > 0 ? Math.min(1, daysUsed / maxDays) : 0;
  const isOver = daysUsed > maxDays;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{flag} {name}</Text>
        <Text style={[styles.value, isOver && styles.valueOver]}>
          {daysUsed} / {maxDays}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {width: `${fraction * 100}%`, backgroundColor: isOver ? '#EF4444' : color},
          ]}
        />
      </View>
      <Text style={styles.caption}>
        Осталось {Math.max(0, maxDays - daysUsed)} {daysWord(Math.max(0, maxDays - daysUsed))} ·
        {' '}из них {daysInJourney} {daysWord(daysInJourney)} — в этой поездке
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#0F0F0F', borderRadius: 14, padding: 14, marginBottom: 10},
  headerRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  label: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
  value: {color: '#D1D5DB', fontSize: 14, fontWeight: '700'},
  valueOver: {color: '#EF4444'},
  track: {height: 8, borderRadius: 4, backgroundColor: '#1F1F1F', overflow: 'hidden'},
  fill: {height: '100%', borderRadius: 4},
  caption: {color: '#6B7280', fontSize: 12, marginTop: 8},
});