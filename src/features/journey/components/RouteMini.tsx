import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { radius, typography, type AppTheme } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import type { RouteNode } from '../useRouteNodes';

const CODE_HEIGHT = 16;
const TRACK_HEIGHT = 16;
const LINE_WIDTH = 2;
export const RETURN_DASH = '4 4';

// Route thumbnail: country codes over dots joined by a line — solid outbound, dashed return.
export function RouteMini({nodes}: { nodes: RouteNode[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel={nodes.map((n) => n.name).join(' → ')}>
      {nodes.map((node, i) => (
        <React.Fragment key={node.key}>
          <View style={styles.node}>
            <Text style={[styles.code, node.isMain && styles.codeMain]} numberOfLines={1}>{node.code ?? '··'}</Text>
            <View style={styles.track}>
              <Dot node={node}/>
            </View>
          </View>
          {i < nodes.length - 1 ? (
            <View style={styles.connector}>
              <RouteLine isReturn={!!node.leg?.isReturn}/>
            </View>
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

export function RouteLine({isReturn, vertical}: { isReturn: boolean; vertical?: boolean }) {
  const theme = useAppTheme();
  const color = isReturn ? theme.colors.warning : theme.colors.primary;
  const half = LINE_WIDTH / 2;
  return (
    <Svg width={vertical ? LINE_WIDTH : '100%'} height={vertical ? '100%' : LINE_WIDTH}>
      <Line
        x1={vertical ? half : 0}
        y1={vertical ? 0 : half}
        x2={vertical ? half : '100%'}
        y2={vertical ? '100%' : half}
        stroke={color}
        strokeWidth={LINE_WIDTH}
        strokeDasharray={isReturn ? RETURN_DASH : undefined}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Dot({node}: { node: RouteNode }) {
  const styles = useThemedStyles(createStyles);
  if (node.isMain) {
    return (
      <View style={styles.mainHalo}>
        <View style={styles.mainDot}/>
      </View>
    );
  }
  // Start and finish are hollow rings, stops in between are filled; colour follows the direction.
  if (node.kind === 'origin') return <View style={styles.ring}/>;
  if (node.kind === 'destination') return <View style={[styles.ring, styles.ringReturn]}/>;
  return <View style={[styles.dot, node.leg?.isReturn && styles.dotReturn]}/>;
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    row: {flexDirection: 'row', alignItems: 'flex-start'},
    node: {alignItems: 'center', minWidth: 22},
    code: {...typography.labelSm, height: CODE_HEIGHT, lineHeight: CODE_HEIGHT, color: colors.textMuted, letterSpacing: 0.6},
    codeMain: {color: colors.safe},
    track: {height: TRACK_HEIGHT, alignItems: 'center', justifyContent: 'center'},
    connector: {
      flex: 1, minWidth: 8, height: TRACK_HEIGHT, justifyContent: 'center',
      marginTop: CODE_HEIGHT, marginHorizontal: -4,
    },
    dot: {width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary},
    dotReturn: {backgroundColor: colors.warning},
    ring: {
      width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.surface,
      borderWidth: 2, borderColor: colors.primary,
    },
    ringReturn: {borderColor: colors.warning},
    mainHalo: {
      width: TRACK_HEIGHT, height: TRACK_HEIGHT, borderRadius: radius.full, alignItems: 'center',
      justifyContent: 'center', backgroundColor: colors.safeSoft,
    },
    mainDot: {width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.safe},
  });
}
