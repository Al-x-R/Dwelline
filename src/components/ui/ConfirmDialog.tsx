import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, space, typography, type AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Button } from './Button';
import { toneColors } from './tone';
import type { IconName, Tone } from './types';

interface Props {
  visible: boolean;
  icon: IconName;
  tone?: Tone;
  title: string;
  message?: string;
  // "Limit impact" block between the text and the buttons.
  highlight?: { icon: IconName; title: string; text: React.ReactNode };
  footnote?: string;
  confirmLabel: string;
  confirmIcon?: IconName;
  // Without it the dialog has a single button (a notice).
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Backdrop tap and the Android back button; defaults to onCancel.
  onDismiss?: () => void;
  busy?: boolean;
}

export function ConfirmDialog({
  visible, icon, tone = 'danger', title, message, highlight, footnote,
  confirmLabel, confirmIcon, cancelLabel, onConfirm, onCancel, onDismiss = onCancel, busy,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {fg, bg} = toneColors(theme.colors, tone);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel={cancelLabel ?? confirmLabel}/>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={[styles.iconBox, {backgroundColor: tone === 'danger' ? theme.colors.dangerStrong : bg}]}>
            <Ionicons name={icon} size={28} color={tone === 'danger' ? theme.colors.onDanger : fg}/>
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? (
            // Long texts (lists, error details) scroll inside the dialog instead of pushing the buttons off screen.
            <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageContent} bounces={false}>
              <Text style={styles.message}>{message}</Text>
            </ScrollView>
          ) : null}

          {highlight ? (
            <View style={styles.highlight}>
              <View style={styles.highlightIcon}>
                <Ionicons name={highlight.icon} size={18} color={theme.colors.safe}/>
              </View>
              <View style={styles.highlightBody}>
                <Text style={styles.highlightTitle}>{highlight.title}</Text>
                <Text style={styles.highlightText}>{highlight.text}</Text>
              </View>
            </View>
          ) : null}

          {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}

          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              icon={confirmIcon}
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onPress={onConfirm}
              busy={busy}
            />
            {cancelLabel ? <Button label={cancelLabel} variant="secondary" onPress={onCancel}/> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles({colors, elevation}: AppTheme) {
  return StyleSheet.create({
    overlay: {flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: space.md},
    dialog: {
      backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
      padding: space.lg, alignItems: 'center', ...elevation.floating,
    },
    iconBox: {width: 64, height: 64, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center'},
    title: {...typography.headlineLg, color: colors.textPrimary, textAlign: 'center', marginTop: space.md},
    messageScroll: {alignSelf: 'stretch', flexGrow: 0, maxHeight: 320, marginTop: space.sm},
    messageContent: {flexGrow: 0},
    message: {...typography.bodyMd, color: colors.textBody, textAlign: 'center'},
    highlight: {
      flexDirection: 'row', gap: space.gutterSm, alignSelf: 'stretch', marginTop: space.md,
      padding: space.gutterSm, borderRadius: radius.md, backgroundColor: colors.surfaceElevated,
    },
    highlightIcon: {
      width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.safeSoft,
    },
    highlightBody: {flex: 1},
    highlightTitle: {...typography.labelCaps, color: colors.safe},
    highlightText: {...typography.bodyMd, color: colors.textPrimary, marginTop: 2},
    footnote: {...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: space.md},
    actions: {alignSelf: 'stretch', gap: space.sm, marginTop: space.md},
  });
}
