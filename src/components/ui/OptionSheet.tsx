import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../../hooks/useAppTheme';
import { BottomSheet } from './BottomSheet';
import { ListRow } from './ListRow';

export interface Option<T extends string | number> {
  value: T;
  label: string;
  subtitle?: string;
}

interface Props<T extends string | number> {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function OptionSheet<T extends string | number>({visible, title, options, value, onSelect, onClose}: Props<T>) {
  const theme = useAppTheme();
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <ListRow
            key={String(opt.value)}
            title={opt.label}
            subtitle={opt.subtitle}
            onPress={() => {
              onSelect(opt.value);
              onClose();
            }}
            trailing={
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={active ? theme.colors.safe : theme.colors.textMuted}
              />
            }
            last={i === options.length - 1}
          />
        );
      })}
    </BottomSheet>
  );
}
