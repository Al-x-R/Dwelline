import type { AppTheme, ThemeColors } from '../../constants/theme';
import type { Tone } from './types';

export function toneColors(colors: ThemeColors, tone: Tone): { fg: string; bg: string } {
  switch (tone) {
    case 'safe':
      return {fg: colors.safe, bg: colors.safeSoft};
    case 'warning':
      return {fg: colors.warning, bg: colors.warningSoft};
    case 'danger':
      return {fg: colors.danger, bg: colors.dangerSoft};
    case 'primary':
      return {fg: colors.accentText, bg: colors.primarySoft};
    default:
      return {fg: colors.textBody, bg: colors.surfaceElevated};
  }
}

export function toneGradient(theme: AppTheme, tone: Tone): readonly [string, string] {
  switch (tone) {
    case 'warning':
      return ['#F59E0B', '#FFB95F'];
    case 'danger':
      return ['#EF4444', '#F87171'];
    case 'primary':
      return theme.dark ? ['#8083FF', '#C0C1FF'] : ['#4338CA', '#6366F1'];
    default:
      return theme.gradients.ring;
  }
}
