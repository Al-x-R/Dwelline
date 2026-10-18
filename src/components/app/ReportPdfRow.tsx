import React, { useState } from 'react';

import { useProGate } from '../../hooks/useProGate';
import { useT } from '../../i18n';
import { shareReportPdf } from '../../services/report/reportService';
import { ListRow, showAlert } from '../ui';

// PDF stay report row, shared by Reports and Settings.
export function ReportPdfRow({last}: { last?: boolean }) {
  const {t} = useT();
  const [busy, setBusy] = useState(false);
  const {isPro, requirePro} = useProGate();

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareReportPdf(t('report.export'));
    } catch (e) {
      console.error('PDF report failed', e);
      void showAlert({icon: 'document-text-outline', tone: 'warning', title: t('report.failed'), message: String(e)});
    } finally {
      setBusy(false);
    }
  };

  return (
    <ListRow
      icon="document-text-outline"
      iconTone="primary"
      title={t('report.export')}
      subtitle={t('report.exportHint')}
      value={isPro ? 'PDF' : t('pro.badge')}
      onPress={() => requirePro(share)}
      last={last}
    />
  );
}
