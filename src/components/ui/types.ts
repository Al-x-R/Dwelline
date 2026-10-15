import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export type Tone = 'safe' | 'warning' | 'danger' | 'primary' | 'neutral';
