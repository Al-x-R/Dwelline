import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useT } from '../../i18n';
import type { BackupFile } from '../../services/backup/backupFormat';
import { exportBackup, hasUndoCopy, pickBackup, restoreBackup, undoImport } from '../../services/backup/backupService';
import { formatDate } from '../../utils/format';
import { ConfirmDialog, ListRow } from '../ui';

// Settings rows for the JSON backup: export, restore (replaces everything, after a confirmation) and undo.
export function BackupRows() {
  const {t, lang} = useT();
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const refreshUndo = useCallback(() => {
    hasUndoCopy().then(setCanUndo).catch(() => setCanUndo(false));
  }, []);

  useEffect(refreshUndo, [refreshUndo]);

  const onExport = async () => {
    try {
      await exportBackup(t('settings.backup'));
    } catch (e) {
      console.error('Backup export failed', e);
      Alert.alert(t('backup.exportFailed'), String(e));
    }
  };

  const onPick = async () => {
    try {
      const result = await pickBackup();
      if (!result) return;
      if (result.ok) setPending(result.backup);
      else Alert.alert(t('backup.errorTitle'), t(`backup.error.${result.error}`));
    } catch (e) {
      console.error('Backup read failed', e);
      Alert.alert(t('backup.errorTitle'), t('backup.error.not_json'));
    }
  };

  const onUndo = async () => {
    try {
      if (await undoImport()) Alert.alert(t('backup.undoneTitle'), t('backup.undoneText'));
    } catch (e) {
      console.error('Undo import failed', e);
    } finally {
      refreshUndo();
    }
  };

  const onConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setPending(null);
      setCanUndo(true);
      Alert.alert(t('backup.doneTitle'), t('backup.doneText'), [
        {text: t('backup.undo'), style: 'destructive', onPress: onUndo},
        {text: t('common.done'), style: 'cancel'},
      ]);
    } catch (e) {
      console.error('Backup restore failed', e);
      setPending(null);
      Alert.alert(t('backup.errorTitle'), String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ListRow
        icon="cloud-upload-outline"
        iconTone="primary"
        title={t('settings.backup')}
        subtitle={t('settings.backupHint')}
        value="JSON"
        onPress={onExport}
      />
      <ListRow
        icon="cloud-download-outline"
        iconTone="primary"
        title={t('settings.restore')}
        subtitle={t('settings.restoreHint')}
        onPress={onPick}
      />
      {canUndo ? (
        <ListRow
          icon="arrow-undo-outline"
          title={t('settings.undoImport')}
          subtitle={t('settings.undoImportHint')}
          onPress={onUndo}
        />
      ) : null}

      <ConfirmDialog
        visible={pending !== null}
        icon="cloud-download-outline"
        tone="warning"
        title={t('backup.confirmTitle')}
        message={pending ? t('backup.confirmText', {
          date: pending.exportedAt ? formatDate(pending.exportedAt, 'D MMMM YYYY', lang) : '—',
          trips: t('backup.trips', {count: pending.data.trips.length}),
          journeys: t('backup.journeys', {count: pending.data.journeys.length}),
        }) : ''}
        footnote={t('backup.confirmFootnote')}
        confirmLabel={t('backup.confirm')}
        confirmIcon="checkmark"
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirm}
        onCancel={() => setPending(null)}
        busy={busy}
      />
    </>
  );
}
