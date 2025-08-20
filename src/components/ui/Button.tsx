import React from 'react';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { buttonStyles, combineStyles } from '../../styles/styles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  customStyle?: CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  customStyle,
  style,
  ...props
}) => {
  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: '#2a2a2a',
          color: '#fff',
          border: '1px solid #444',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#aaa',
          border: '1px solid #444',
        };
      case 'danger':
        return {
          backgroundColor: '#ff4444',
          color: '#fff',
          border: 'none',
        };
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
        };
      default:
        return buttonStyles.primary;
    }
  };

  const finalStyles = combineStyles(
    buttonStyles.base,
    getVariantStyles(),
    buttonStyles.sizes[size],
    fullWidth ? { width: '100%' } : {},
    customStyle,
    style
  );

  return (
    <button style={finalStyles} {...props}>
      {icon && iconPosition === 'left' && (
        <span style={{ marginRight: children ? '0.5rem' : 0 }}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span style={{ marginLeft: children ? '0.5rem' : 0 }}>{icon}</span>
      )}
    </button>
  );
};

export default Button;
