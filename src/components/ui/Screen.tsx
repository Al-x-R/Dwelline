import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  children: React.ReactNode;
  edges?: Edge[];
  // Soft glow at the top edge, as in the Nocturne mockups.
  glow?: Glow | 'none';
  style?: ViewStyle;
}

type Glow = 'safe' | 'warning' | 'primary' | 'danger';

const GLOW: Record<Glow, { dark: string; light: string }> = {
  safe: {dark: 'rgba(16, 185, 129, 0.10)', light: 'rgba(16, 185, 129, 0.06)'},
  warning: {dark: 'rgba(245, 158, 11, 0.10)', light: 'rgba(245, 158, 11, 0.06)'},
  primary: {dark: 'rgba(99, 102, 241, 0.12)', light: 'rgba(79, 70, 229, 0.06)'},
  danger: {dark: 'rgba(239, 68, 68, 0.10)', light: 'rgba(239, 68, 68, 0.05)'},
};

export function Screen({children, edges = ['top'], glow = 'none', style}: Props) {
  const theme = useAppTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.root, {backgroundColor: theme.colors.canvas}, style]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'}/>
      {glow !== 'none' ? (
        <View pointerEvents="none" style={styles.glow}>
          <LinearGradient
            colors={[theme.dark ? GLOW[glow].dark : GLOW[glow].light, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  glow: {position: 'absolute', top: 0, left: 0, right: 0, height: 420},
});
