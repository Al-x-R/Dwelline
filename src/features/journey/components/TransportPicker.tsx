import React from 'react';

import type { TransportMode } from '../../../types/Trip';
import { useT } from '../../../i18n';
import { SegmentedControl } from '../../../components/ui';
import { TRANSPORT_ICONS, TRANSPORT_MODES } from '../journeyUtils';

interface Props {
  value?: TransportMode;
  onChange: (mode: TransportMode | undefined) => void;
}

export function TransportPicker({value, onChange}: Props) {
  const {t} = useT();
  return (
    <SegmentedControl
      options={TRANSPORT_MODES.map((mode) => ({
        value: mode,
        icon: TRANSPORT_ICONS[mode],
        accessibilityLabel: t(`transport.${mode}`),
      }))}
      value={value}
      onChange={onChange}
      allowDeselect
      onDeselect={() => onChange(undefined)}
    />
  );
}
