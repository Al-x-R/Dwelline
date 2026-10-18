import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { layout } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AlertHost } from './AlertHost';

interface Props {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
}

// Every screen shares the same soft ambient glow at the top (theme.gradients.ambient).
// Status colour lives in the components (dial, pills, card glow), never in the background.
export function Screen({children, edges = ['top'], style}: Props) {
  const theme = useAppTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.root, {backgroundColor: theme.colors.canvas}, style]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'}/>
      <View pointerEvents="none" style={styles.ambient}>
        <LinearGradient colors={theme.gradients.ambient} locations={layout.ambientStops} style={StyleSheet.absoluteFill}/>
      </View>
      {children}
      <AlertHost/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  ambient: {position: 'absolute', top: 0, left: 0, right: 0, height: layout.ambientHeight},
});
