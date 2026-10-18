import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useT } from '../../i18n';
import { DIALOG_SWITCH_DELAY_MS, useAlertStore } from './alert';
import { ConfirmDialog } from './ConfirmDialog';

// Rendered by every Screen; only the focused one shows dialogs, so they open on top of modal screens too.
export function AlertHost() {
  const focused = useIsFocused();
  const {t} = useT();
  const current = useAlertStore((s) => s.queue[0]);
  const settle = useAlertStore((s) => s.settle);
  const [shownId, setShownId] = useState<number | null>(null);
  const closing = useAlertStore((s) => s.closing);

  useEffect(() => {
    if (!focused || !current) return;
    const timer = setTimeout(() => setShownId(current.id), DIALOG_SWITCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focused, current]);

  const content = current ?? closing;
  if (!focused || !content) return null;

  const close = (result: 'confirm' | 'cancel' | 'dismiss') => {
    if (!current) return;
    setShownId(null);
    settle(current.id, result);
  };

  return (
    <ConfirmDialog
      visible={!!current && shownId === current.id}
      icon={content.icon ?? 'information-circle-outline'}
      tone={content.tone ?? 'primary'}
      title={content.title}
      message={content.message}
      confirmLabel={content.confirmLabel ?? t('common.ok')}
      confirmIcon={content.confirmIcon}
      cancelLabel={content.cancelLabel}
      onConfirm={() => close('confirm')}
      onCancel={() => close('cancel')}
      onDismiss={() => close('dismiss')}
    />
  );
}
