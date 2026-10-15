import type { TextStyle, ViewStyle } from 'react-native';

export interface ThemeColors {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighest: string;
  input: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textBody: string;
  textMuted: string;
  primary: string;
  primaryActive: string;
  onPrimary: string;
  primarySoft: string;
  accentText: string;
  track: string;
  safe: string;
  safeSoft: string;
  onSafe: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  dangerStrong: string;
  onDanger: string;
  scrim: string;
  disabled: string;
  onDisabled: string;
  tabActive: string;
  tabInactive: string;
  // Selected calendar day and its label.
  selectedDay: string;
  onSelectedDay: string;
  // Draggable / indicator knob on bars.
  knob: string;
}

export interface ThemeGradients {
  primary: readonly [string, string];
  safe: readonly [string, string];
  danger: readonly [string, string];
  ring: readonly [string, string];
  // Progress rings / dials by tone.
  warningRing: readonly [string, string];
  dangerRing: readonly [string, string];
  primaryRing: readonly [string, string];
  // Soft glow at the top of every screen: strongest at the edge, fading to transparent (see layout.ambientStops).
  ambient: readonly [string, string, string];
  // Highlight cards: Pro banner in Settings, demo card in onboarding.
  proCard: readonly [string, string];
  heroCard: readonly [string, string];
}

export interface ThemeElevation {
  card: ViewStyle;
  floating: ViewStyle;
  sheet: ViewStyle;
  interactive: ViewStyle;
  focus: ViewStyle;
  safeGlow: ViewStyle;
  dangerGlow: ViewStyle;
  selectedDay: ViewStyle;
  knob: ViewStyle;
}

export interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
  gradients: ThemeGradients;
  elevation: ThemeElevation;
}

const lightColors: ThemeColors = {
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceHighest: '#E2E8F0',
  input: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textBody: '#334155',
  textMuted: '#64748B',
  primary: '#4338CA',
  primaryActive: '#4F46E5',
  onPrimary: '#FFFFFF',
  primarySoft: '#EEF0FF',
  accentText: '#4338CA',
  track: '#E9EEF5',
  safe: '#059669',
  safeSoft: '#ECFDF5',
  onSafe: '#FFFFFF',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerStrong: '#DC2626',
  onDanger: '#FFFFFF',
  scrim: 'rgba(15, 23, 42, 0.25)',
  disabled: '#E2E8F0',
  onDisabled: '#94A3B8',
  tabActive: '#4338CA',
  tabInactive: '#94A3B8',
  selectedDay: '#4338CA',
  onSelectedDay: '#FFFFFF',
  knob: '#FFFFFF',
};

const darkColors: ThemeColors = {
  canvas: '#0B0F15',
  surface: '#131822',
  surfaceElevated: '#1A2030',
  surfaceHighest: '#242B3B',
  input: '#171E2E',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  textPrimary: '#E6E8F0',
  textBody: '#C7C4D7',
  textMuted: '#908FA0',
  primary: '#6366F1',
  primaryActive: '#4F46E5',
  onPrimary: '#FFFFFF',
  primarySoft: 'rgba(99, 102, 241, 0.16)',
  accentText: '#C0C1FF',
  track: '#1C2333',
  safe: '#4EDEA3',
  safeSoft: 'rgba(78, 222, 163, 0.12)',
  onSafe: '#003824',
  warning: '#FFB95F',
  warningSoft: 'rgba(255, 185, 95, 0.12)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.14)',
  dangerStrong: '#93000A',
  onDanger: '#FFDAD6',
  scrim: 'rgba(0, 0, 0, 0.6)',
  disabled: '#1A2030',
  onDisabled: '#5C5F70',
  tabActive: '#4EDEA3',
  tabInactive: '#7D8094',
  selectedDay: '#E6E8F0',
  onSelectedDay: '#0B0F15',
  knob: '#FFFFFF',
};

export const lightTheme: AppTheme = {
  dark: false,
  colors: lightColors,
  gradients: {
    primary: ['#4F46E5', '#4338CA'],
    safe: ['#10B981', '#059669'],
    danger: ['#EF4444', '#DC2626'],
    ring: ['#10B981', '#059669'],
    warningRing: ['#F59E0B', '#FFB95F'],
    dangerRing: ['#EF4444', '#F87171'],
    primaryRing: ['#4338CA', '#6366F1'],
    ambient: ['rgba(79, 70, 229, 0.10)', 'rgba(79, 70, 229, 0.04)', 'rgba(79, 70, 229, 0)'],
    proCard: ['#EEF0FF', '#ECFDF5'],
    heroCard: ['#FFFFFF', '#ECFDF5'],
  },
  elevation: {
    card: {boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 16px -4px rgba(15, 23, 42, 0.02)'},
    floating: {boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 12px 24px -4px rgba(15, 23, 42, 0.04)'},
    sheet: {boxShadow: '0 -10px 40px rgba(15, 23, 42, 0.06)'},
    interactive: {boxShadow: '0 4px 6px -1px rgba(67, 56, 202, 0.18), 0 12px 24px -4px rgba(67, 56, 202, 0.2)'},
    focus: {boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.12)'},
    safeGlow: {},
    dangerGlow: {},
    selectedDay: {boxShadow: '0 4px 12px rgba(67, 56, 202, 0.3)'},
    knob: {boxShadow: '0 0 6px rgba(0, 0, 0, 0.35)'},
  },
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: darkColors,
  gradients: {
    primary: ['#6366F1', '#4F46E5'],
    safe: ['#34D399', '#14B8A6'],
    danger: ['#B3121B', '#93000A'],
    ring: ['#10B981', '#34D399'],
    warningRing: ['#F59E0B', '#FFB95F'],
    dangerRing: ['#EF4444', '#F87171'],
    primaryRing: ['#8083FF', '#C0C1FF'],
    ambient: ['rgba(99, 102, 241, 0.20)', 'rgba(99, 102, 241, 0.07)', 'rgba(99, 102, 241, 0)'],
    proCard: ['rgba(99, 102, 241, 0.28)', 'rgba(16, 185, 129, 0.14)'],
    heroCard: ['#1A2030', '#10261F'],
  },
  elevation: {
    card: {},
    floating: {boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'},
    sheet: {},
    interactive: {boxShadow: '0 0 20px -2px rgba(99, 102, 241, 0.45)'},
    focus: {boxShadow: '0 0 20px -2px rgba(99, 102, 241, 0.35)'},
    safeGlow: {boxShadow: '0 0 24px -4px rgba(16, 185, 129, 0.35)'},
    dangerGlow: {boxShadow: '0 0 24px -4px rgba(239, 68, 68, 0.35)'},
    selectedDay: {boxShadow: '0 0 16px rgba(192, 193, 255, 0.45)'},
    knob: {boxShadow: '0 0 6px rgba(0, 0, 0, 0.35)'},
  },
};

export const radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const layout = {
  // Ambient glow at the top of a screen: height and where its three colours sit.
  ambientHeight: 480,
  ambientStops: [0, 0.45, 1] as const,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  gutterSm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Plus Jakarta Sans
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

// letterSpacing
export const typography = {
  displayHero: {fontFamily: fonts.bold, fontSize: 64, lineHeight: 72, letterSpacing: -1.9},
  displayLg: {fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.75},
  headlineXl: {fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64},
  headlineLg: {fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.48},
  headlineMd: {fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, letterSpacing: -0.3},
  headlineSm: {fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.18},
  titleMd: {fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.16},
  bodyLg: {fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, letterSpacing: -0.08},
  bodyMd: {fontFamily: fonts.regular, fontSize: 14, lineHeight: 20},
  bodySm: {fontFamily: fonts.regular, fontSize: 13, lineHeight: 18},
  labelCaps: {fontFamily: fonts.bold, fontSize: 11, lineHeight: 16, letterSpacing: 0.88, textTransform: 'uppercase'},
  labelMd: {fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.24},
  labelSm: {fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.44},
  numericMetric: {fontFamily: fonts.bold, fontSize: 42, lineHeight: 46, letterSpacing: -1.68},
} satisfies Record<string, TextStyle>;

export const tabularNums: TextStyle = {fontVariant: ['tabular-nums']};

// Palette for telling zones apart in lists and charts.
export const ZONE_PALETTE = ['#6366F1', '#F59E0B', '#10B981', '#A855F7', '#EC4899', '#14B8A6', '#3B82F6'];
