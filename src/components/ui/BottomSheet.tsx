import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useT } from '../../i18n';
import { IconButton } from './IconButton';

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  // Take up almost the whole screen (long lists).
  tall?: boolean;
}

export function BottomSheet({visible, title, subtitle, onClose, children, tall}: Props) {
  const styles = useThemedStyles(createStyles);
  const {t} = useT();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')}/>
        <SafeAreaView edges={['bottom']} style={[styles.sheet, tall && styles.tall]}>
          <View style={styles.handle}/>
          {title ? (
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <IconButton icon="close" size="sm" onPress={onClose} accessibilityLabel={t('common.close')}/>
            </View>
          ) : null}
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    overlay: {flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end'},
    sheet: {
      backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      paddingHorizontal: space.md, paddingBottom: space.sm, borderWidth: 1, borderBottomWidth: 0,
      borderColor: colors.border, maxHeight: '92%', ...elevation.sheet,
    },
    tall: {height: '88%'},
    handle: {
      alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full,
      backgroundColor: colors.borderStrong, marginTop: space.sm,
    },
    header: {flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm, marginBottom: space.md},
    headerText: {flex: 1},
    title: {...typography.headlineSm, color: colors.textPrimary},
    subtitle: {...typography.bodySm, color: colors.textMuted, marginTop: 2},
  });
}
