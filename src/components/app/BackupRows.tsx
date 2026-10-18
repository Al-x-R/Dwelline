import React, { useCallback, useEffect, useState } from 'react';

import { useT } from '../../i18n';
import type { BackupFile } from '../../services/backup/backupFormat';
import { exportBackup, hasUndoCopy, pickBackup, restoreBackup, undoImport } from '../../services/backup/backupService';
import { formatDate } from '../../utils/format';
import { ConfirmDialog, DIALOG_SWITCH_DELAY_MS, ListRow, showAlert } from '../ui';

// Settings rows for the JSON backup: export, restore (replaces everything, after a confirmation) and undo.
export function BackupRows() {
  const {t, lang} = useT();
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  const refreshUndo = useCallback(() => {
    hasUndoCopy().then(setCanUndo).catch(() => setCanUndo(false));
  }, []);

  useEffect(refreshUndo, [refreshUndo]);

  const onExport = async () => {
    try {
      await exportBackup(t('settings.backup'));
    } catch (e) {
      console.error('Backup export failed', e);
      void showAlert({icon: 'cloud-upload-outline', tone: 'warning', title: t('backup.exportFailed'), message: String(e)});
    }
  };

  const onPick = async () => {
    try {
      const result = await pickBackup();
      if (!result) return;
      if (result.ok) setPending(result.backup);
      else void showAlert({icon: 'document-outline', tone: 'warning', title: t('backup.errorTitle'), message: t(`backup.error.${result.error}`)});
    } catch (e) {
      console.error('Backup read failed', e);
      void showAlert({icon: 'document-outline', tone: 'warning', title: t('backup.errorTitle'), message: t('backup.error.not_json')});
    }
  };

  const onUndo = async () => {
    setBusy(true);
    try {
      const undone = await undoImport();
      setConfirmUndo(false);
      if (undone) void showAlert({icon: 'arrow-undo-outline', tone: 'safe', title: t('backup.undoneTitle'), message: t('backup.undoneText')});
    } catch (e) {
      console.error('Undo import failed', e);
      setConfirmUndo(false);
    } finally {
      setBusy(false);
      refreshUndo();
    }
  };

  const onConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setCanUndo(true);
    } catch (e) {
      console.error('Backup restore failed', e);
      void showAlert({icon: 'cloud-download-outline', tone: 'warning', title: t('backup.errorTitle'), message: String(e)});
      return;
    } finally {
      setPending(null);
      setBusy(false);
    }
    const choice = await showAlert({
      icon: 'checkmark-circle-outline',
      tone: 'safe',
      title: t('backup.doneTitle'),
      message: t('backup.doneText'),
      confirmLabel: t('common.done'),
      cancelLabel: t('backup.undo'),
    });
    // Wait for the notice to close before opening the confirmation over it.
    if (choice === 'cancel') setTimeout(() => setConfirmUndo(true), DIALOG_SWITCH_DELAY_MS);
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
          onPress={() => setConfirmUndo(true)}
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

      <ConfirmDialog
        visible={confirmUndo}
        icon="arrow-undo-outline"
        tone="warning"
        title={t('backup.undoConfirmTitle')}
        message={t('backup.undoConfirmText')}
        confirmLabel={t('backup.undo')}
        confirmIcon="arrow-undo-outline"
        cancelLabel={t('backup.keep')}
        onConfirm={onUndo}
        onCancel={() => setConfirmUndo(false)}
        busy={busy}
      />
    </>
  );
}
