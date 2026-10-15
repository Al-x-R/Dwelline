import React from 'react';
import { Switch } from 'react-native';

import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

export function Toggle({value, onValueChange, accessibilityLabel, disabled}: Props) {
  const {colors} = useAppTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{false: colors.surfaceHighest, true: colors.safe}}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.surfaceHighest}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
