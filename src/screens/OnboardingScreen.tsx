// src/screens/OnboardingScreen.tsx.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Календарь — в разработке</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center'},
  text: {color: '#6B7280', fontSize: 16},
});