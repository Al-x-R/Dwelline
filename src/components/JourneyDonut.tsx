import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  zoneId: string;
  label: string;
  flag: string;
  days: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  totalDays: number;
  size?: number;
  strokeWidth?: number;
}

export default function JourneyDonut({segments, totalDays, size = 220, strokeWidth = 24}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <Svg width={size} height={size} style={{position: 'absolute'}}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1F1F1F"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((seg) => {
          const fraction = totalDays > 0 ? seg.days / totalDays : 0;
          const segmentLength = circumference * fraction;
          const dashArray = `${segmentLength} ${circumference - segmentLength}`;
          const dashOffset = -cumulativeOffset;
          cumulativeOffset += segmentLength;

          return (
            <Circle
              key={seg.zoneId}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}
      </Svg>

      <View style={styles.center}>
        <Text style={styles.totalDays}>{totalDays}</Text>
        <Text style={styles.label}>{totalDays === 1 ? 'день' : 'дней всего'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center'},
  totalDays: {fontSize: 44, fontWeight: '700', color: '#FFFFFF'},
  label: {fontSize: 12, color: '#9CA3AF', marginTop: 2},
});