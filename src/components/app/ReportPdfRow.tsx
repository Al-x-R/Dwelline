import React, { useState } from 'react';
import { Alert } from 'react-native';

import { useT } from '../../i18n';
import { shareReportPdf } from '../../services/report/reportService';
import { ListRow } from '../ui';

// PDF stay report row, shared by Reports and Settings.
export function ReportPdfRow({last}: { last?: boolean }) {
  const {t} = useT();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareReportPdf(t('report.export'));
    } catch (e) {
      console.error('PDF report failed', e);
      Alert.alert(t('report.failed'), String(e));
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
      value="PDF"
      onPress={onPress}
      last={last}
    />
  );
}
