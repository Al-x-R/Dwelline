import React from 'react';
import { StyleSheet, View } from 'react-native';

import { radius } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface BarSegment {
  value: number; // fraction 0..1
  color: string;
}

interface Props {
  // Single color — plain bar; multiple segments — stacked (used/planned/free).
  progress?: number;
  color?: string;
  segments?: BarSegment[];
  height?: number;
  thumb?: boolean;
}

export function ProgressBar({progress = 0, color, segments, height = 8, thumb = false}: Props) {
  const theme = useAppTheme();
  const parts = segments ?? [{value: Math.max(0, Math.min(1, progress)), color: color ?? theme.colors.safe}];
  const total = Math.min(1, parts.reduce((acc, p) => acc + p.value, 0));
  return (
    <View style={[styles.track, {height, backgroundColor: theme.colors.track}]}>
      <View style={[styles.fill, {width: `${total * 100}%`}]}>
        {parts.map((p, i) => (
          <View key={i} style={{flex: p.value, backgroundColor: p.color}}/>
        ))}
      </View>
      {thumb && total > 0 ? (
        <View
          style={[
            styles.thumb,
            {backgroundColor: theme.colors.knob, ...theme.elevation.knob},
            {left: `${total * 100}%`, width: height + 6, height: height + 6, marginLeft: -(height + 6) / 2, top: -3},
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {borderRadius: radius.full, overflow: 'visible', justifyContent: 'center'},
  fill: {height: '100%', flexDirection: 'row', borderRadius: radius.full, overflow: 'hidden'},
  thumb: {position: 'absolute', borderRadius: radius.full},
});
