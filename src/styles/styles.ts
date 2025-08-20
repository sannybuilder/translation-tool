import { colors, spacing, fontSize, borderRadius, transitions, shadows } from './theme';
import type { CSSProperties } from 'react';

// Responsive breakpoints
export const breakpoints = {
  mobile: 768,
  medium: 1024,
} as const;

// Helper to get screen size
export const getScreenSize = (width: number): 'mobile' | 'medium' | 'desktop' => {
  if (width <= breakpoints.mobile) return 'mobile';
  if (width <= breakpoints.medium) return 'medium';
  return 'desktop';
};

// Common button styles
export const buttonStyles = {
  base: {
    border: 'none',
    cursor: 'pointer',
    transition: transitions.normal,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  
  primary: {
    backgroundColor: colors.primary,
    color: colors.textPrimary,
    '&:hover': {
      backgroundColor: colors.primaryDark,
    },
  } as CSSProperties,
  
  secondary: {
    backgroundColor: colors.bgTertiary,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderSecondary}`,
  } as CSSProperties,
  
  ghost: {
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.borderSecondary}`,
  } as CSSProperties,
  
  sizes: {
    small: {
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: fontSize.sm,
      borderRadius: borderRadius.sm,
    } as CSSProperties,
    medium: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: fontSize.base,
      borderRadius: borderRadius.md,
    } as CSSProperties,
    large: {
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: fontSize.xl,
      borderRadius: borderRadius.md,
    } as CSSProperties,
  },
};

// Common container styles
export const containerStyles = {
  card: {
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.borderPrimary}`,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  } as CSSProperties,
  
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
  } as CSSProperties,
  
  panel: {
    backgroundColor: colors.bgPrimary,
    borderLeft: `1px solid ${colors.borderPrimary}`,
    boxShadow: shadows.xl,
  } as CSSProperties,
};

// Text area styles
export const textAreaStyles = {
  base: {
    backgroundColor: colors.bgTertiary,
    border: `1px solid ${colors.borderSecondary}`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    resize: 'none' as const,
    overflow: 'hidden',
    fontFamily: 'inherit',
    transition: transitions.normal,
    width: '100%',
    lineHeight: '1.5',
  } as CSSProperties,
  
  status: {
    translated: {
      color: colors.success,
      borderColor: `${colors.success}66`,
    },
    missing: {
      color: colors.error,
      borderColor: `${colors.error}66`,
    },
    same: {
      color: colors.warning,
      borderColor: `${colors.warning}66`,
    },
    invalid: {
      color: colors.error,
      borderColor: `${colors.error}66`,
    },
  },
};

// Badge styles
export const badgeStyles = {
  base: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,
  
  variants: {
    error: {
      backgroundColor: colors.error,
      color: colors.textPrimary,
    },
    warning: {
      backgroundColor: colors.warning,
      color: colors.textPrimary,
    },
    success: {
      backgroundColor: colors.success,
      color: colors.textPrimary,
    },
    info: {
      backgroundColor: colors.info,
      color: colors.textPrimary,
    },
  },
};

// Responsive padding helper
export const getResponsivePadding = (screenSize: 'mobile' | 'medium' | 'desktop'): string => {
  switch (screenSize) {
    case 'mobile':
      return spacing.md;
    case 'medium':
      return spacing.lg;
    default:
      return spacing.xl;
  }
};

// Responsive font size helper
export const getResponsiveFontSize = (
  screenSize: 'mobile' | 'medium' | 'desktop',
  base: keyof typeof fontSize = 'base'
): string => {
  const sizeMap = {
    mobile: {
      xs: fontSize.xs,
      sm: fontSize.xs,
      md: fontSize.sm,
      base: fontSize.md,
      lg: fontSize.base,
      xl: fontSize.lg,
      xxl: fontSize.xl,
      xxxl: fontSize.xxl,
    },
    medium: {
      xs: fontSize.xs,
      sm: fontSize.sm,
      md: fontSize.md,
      base: fontSize.base,
      lg: fontSize.lg,
      xl: fontSize.xl,
      xxl: fontSize.xxl,
      xxxl: fontSize.xxxl,
    },
    desktop: {
      xs: fontSize.xs,
      sm: fontSize.sm,
      md: fontSize.md,
      base: fontSize.base,
      lg: fontSize.lg,
      xl: fontSize.xl,
      xxl: fontSize.xxl,
      xxxl: fontSize.xxxl,
    },
  };
  
  return sizeMap[screenSize][base];
};

// Combine styles helper
export const combineStyles = (...styles: (CSSProperties | undefined)[]): CSSProperties => {
  return Object.assign({}, ...styles.filter(Boolean));
};
