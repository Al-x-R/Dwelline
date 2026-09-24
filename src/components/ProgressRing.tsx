import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
    daysUsed: number;
    maxDays: number;
    size?: number;
    strokeWidth?: number;
}

function getStatusColor(daysUsed: number, maxDays: number): string {
    const ratio = daysUsed / maxDays;
    if (ratio >= 1) return '#EF4444';   // красный — нарушение
    if (ratio >= 0.78) return '#F59E0B'; // жёлтый — приближение к лимиту (≈70+ дней из 90)
    return '#22C55E';                    // зелёный — всё в порядке
}

export default function ProgressRing({
                                         daysUsed,
                                         maxDays,
                                         size = 260,
                                         strokeWidth = 16,
                                     }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(daysUsed / maxDays, 1);
    const strokeDashoffset = circumference * (1 - progress);
    const color = getStatusColor(daysUsed, maxDays);

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                {/* Фоновый трек кольца */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1F1F1F"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Активный прогресс */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    // Поворот, чтобы прогресс начинался сверху (12 часов), как в дизайне
                    rotation={-90}
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            <View style={styles.center}>
                <Text style={styles.daysUsed}>{daysUsed}</Text>
                <Text style={styles.divider}>/ {maxDays}</Text>
                <Text style={[styles.label, { color }]}>ДНЕЙ</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        alignItems: 'center',
    },
    daysUsed: {
        fontSize: 56,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    divider: {
        fontSize: 20,
        color: '#6B7280',
        marginTop: -4,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginTop: 8,
    },
});