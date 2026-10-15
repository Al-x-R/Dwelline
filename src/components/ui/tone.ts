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
      return theme.gradients.warningRing;
    case 'danger':
      return theme.gradients.dangerRing;
    case 'primary':
      return theme.gradients.primaryRing;
    default:
      return theme.gradients.ring;
  }
}
