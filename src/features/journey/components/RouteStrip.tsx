import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { space, typography, type AppTheme } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { FlagBadge, type IconName } from '../../../components/ui';

export interface RouteNode {
  key: string;
  flag: string;
  name: string;
  caption?: string;
  // Leg to the next node.
  transportIcon?: IconName;
  legLabel?: string;
}

// Horizontal route strip: flag → transport and travel time → flag…
export function RouteStrip({nodes}: { nodes: RouteNode[] }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {nodes.map((node, i) => (
        <React.Fragment key={node.key}>
          <View style={styles.node}>
            <FlagBadge flag={node.flag} size={36}/>
            <View>
              <Text style={styles.name} numberOfLines={1}>{node.name}</Text>
              {node.caption ? <Text style={styles.caption}>{node.caption}</Text> : null}
            </View>
          </View>
          {i < nodes.length - 1 ? (
            <View style={styles.leg}>
              <Ionicons name={node.transportIcon ?? 'ellipsis-horizontal'} size={16} color={theme.colors.accentText}/>
              <View style={styles.line}/>
              {node.legLabel ? <Text style={styles.legLabel}>{node.legLabel}</Text> : null}
            </View>
          ) : null}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

function createStyles({colors}: AppTheme) {
  return StyleSheet.create({
    row: {alignItems: 'center', paddingVertical: space.xs},
    node: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
    name: {...typography.labelMd, fontSize: 13, color: colors.textPrimary, maxWidth: 110},
    caption: {...typography.bodySm, fontSize: 12, color: colors.textMuted},
    leg: {alignItems: 'center', width: 64, marginHorizontal: space.xs},
    line: {height: 2, alignSelf: 'stretch', borderRadius: 1, backgroundColor: colors.primarySoft, marginVertical: 3},
    legLabel: {...typography.labelSm, fontSize: 10, color: colors.textMuted},
  });
}
