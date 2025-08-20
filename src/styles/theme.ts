// Centralized theme and style constants
export const colors = {
  // Primary colors
  primary: '#4CAF50',
  primaryDark: '#45a049',
  primaryLight: '#4CAF501a',
  
  // Status colors
  error: '#ff4444',
  warning: '#ff9800',
  success: '#4CAF50',
  info: '#1565C0',
  
  // Background colors
  bgPrimary: '#1a1a1a',
  bgSecondary: '#242424',
  bgTertiary: '#2a2a2a',
  bgDark: '#181818',
  bgDarker: '#0a0a0a',
  bgHover: '#3a3a3a',
  bgDragging: '#1f1f1f',
  
  // Text colors
  textPrimary: '#fff',
  textSecondary: '#aaa',
  textMuted: '#888',
  textDark: '#666',
  textLight: '#ccc',
  
  // Border colors
  borderPrimary: '#333',
  borderSecondary: '#444',
  borderLight: '#555',
  
  // Special colors
  discord: '#5865F2',
  github: '#222',
  orange: '#E65100',
  orangeDark: '#BF360C',
  purple: '#9C27B0',
  purpleDark: '#7B1FA2',
  infoDark: '#0D47A1',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  xxl: '2rem',
} as const;

export const fontSize = {
  xs: '0.7rem',
  sm: '0.8rem',
  md: '0.85rem',
  base: '0.9rem',
  lg: '0.95rem',
  xl: '1rem',
  xxl: '1.15rem',
  xxxl: '1.25rem',
} as const;

export const borderRadius = {
  sm: '3px',
  md: '4px',
  lg: '6px',
  xl: '8px',
} as const;

export const transitions = {
  fast: 'all 0.2s ease',
  normal: 'all 0.3s ease',
  slow: 'all 0.5s ease',
} as const;

export const shadows = {
  sm: '0 1px 4px rgba(0,0,0,0.2)',
  md: '0 2px 4px rgba(0,0,0,0.2)',
  lg: '0 4px 8px rgba(0,0,0,0.2)',
  xl: '0 4px 12px rgba(0,0,0,0.5)',
} as const;

export const zIndex = {
  modal: 1000,
  overlay: 999,
  backdrop: 998,
  header: 100,
  normal: 1,
} as const;
