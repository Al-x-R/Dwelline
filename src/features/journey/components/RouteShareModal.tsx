import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { POSTER, space, fonts } from '../../../constants/theme';
import { useT } from '../../../i18n';
import type { IconName } from '../../../components/ui';
import type { Leg } from '../useJourneyDraft';
import type { RouteNode } from '../useRouteNodes';
import { RoutePoster, type PosterStatus } from './RoutePoster';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  status?: PosterStatus;
  nodes: RouteNode[];
  legs: Leg[];
  onClose: () => void;
}

// Full-screen route map; "Share" renders the poster (map + summary) to PNG and opens the system sheet.
export function RouteShareModal({visible, title, subtitle, badge, status, nodes, legs, onClose}: Props) {
  const {t} = useT();
  const posterRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    setCapturing(true);
    try {
      // Let the map re-render without the leg card and hint before taking the picture.
      await nextFrame();
      await nextFrame();
      // Captured at the device pixel ratio: ≈1080px wide on modern phones, Instagram's native width.
      const uri = await captureRef(posterRef, {format: 'png', quality: 1, result: 'tmpfile'});
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {mimeType: 'image/png', UTI: 'public.png', dialogTitle: t('route.share')});
      } else {
        await Share.share({url: uri, message: title});
      }
    } catch {
      Alert.alert(t('route.shareFailed'));
    } finally {
      setCapturing(false);
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {/* A Modal is a separate native root: it needs its own provider, otherwise insets are 0 and the header slides under the notch. */}
      <SafeAreaProvider>
        <StatusBar style="light"/>
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
          <View style={styles.topBar}>
            <RoundButton icon="close" onPress={onClose} label={t('common.close')}/>
            <Text style={styles.topTitle} numberOfLines={1}>{t('form.route')}</Text>
            <RoundButton icon="share-social-outline" onPress={share} label={t('route.share')} busy={busy}/>
          </View>

          <RoutePoster
            ref={posterRef}
            title={title}
            subtitle={subtitle}
            badge={badge}
            status={status}
            nodes={nodes}
            legs={legs}
            capturing={capturing}
          />

          {/* The poster's panel runs down to the home indicator. */}
          <SafeAreaView edges={['bottom']} style={styles.bottom}/>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function RoundButton({icon, onPress, label, busy}: { icon: IconName; onPress: () => void; label: string; busy?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={8}
      style={({pressed}) => [styles.round, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? <ActivityIndicator color={POSTER.text}/> : <Ionicons name={icon} size={20} color={POSTER.text}/>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: POSTER.canvas},
  topBar: {flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm},
  topTitle: {flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 15, color: POSTER.text, letterSpacing: 0.2},
  round: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: POSTER.control, borderWidth: 1, borderColor: POSTER.chipBorder,
  },
  pressed: {opacity: 0.75, transform: [{scale: 0.98}]},
  bottom: {backgroundColor: POSTER.panel},
});
