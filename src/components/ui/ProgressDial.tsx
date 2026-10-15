import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  colors: readonly [string, string];
  children?: React.ReactNode;
  // Glowing "drop" at the end of the arc, as on the home screen.
  showThumb?: boolean;
}

export function ProgressDial({progress, size = 260, strokeWidth = 12, colors, children, showThumb = true}: Props) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2 - (showThumb ? 6 : 0);
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const angle = clamped * 2 * Math.PI - Math.PI / 2;
  const thumbX = c + r * Math.cos(angle);
  const thumbY = c + r * Math.sin(angle);
  const gradientId = `dial-${colors[0].replace('#', '')}-${colors[1].replace('#', '')}`;

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]}/>
            <Stop offset="1" stopColor={colors[1]}/>
          </LinearGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r} stroke={theme.colors.track} strokeWidth={strokeWidth} fill="none"/>
        {clamped > 0 ? (
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${c} ${c})`}
          />
        ) : null}
        {showThumb ? (
          <>
            <Circle cx={thumbX} cy={thumbY} r={strokeWidth} fill={colors[1]} opacity={0.25}/>
            <Circle cx={thumbX} cy={thumbY} r={strokeWidth * 0.75} fill={colors[1]}/>
          </>
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center', justifyContent: 'center'},
});
