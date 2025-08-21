import React, { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react';
import type { TranslationEntry } from '../types/translation';
import { colors, spacing, fontSize, borderRadius } from '../styles/theme';
import { textAreaStyles, badgeStyles } from '../styles/styles';
import type { ScreenSize } from '../hooks/useScreenSize';

interface TranslationRowProps {
  entry: TranslationEntry;
  onTranslationChange: (section: string, key: string, value: string) => void;
  screenSize?: ScreenSize;
  onFocusEntry?: (section: string, key: string) => void;
  onBlurEntry?: () => void;
}

const TranslationRow = forwardRef<HTMLTextAreaElement, TranslationRowProps>(
  ({ entry, onTranslationChange, screenSize = 'desktop', onFocusEntry, onBlurEntry }, ref) => {
    const englishTextRef = useRef<HTMLTextAreaElement>(null);
    const translationTextRef = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(entry.translatedText);
    
    const isMobile = screenSize === 'mobile';
    const isMedium = screenSize === 'medium';
    
    useImperativeHandle(ref, () => translationTextRef.current!, []);

    const autoResize = (textarea: HTMLTextAreaElement | null) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    useEffect(() => {
      setLocalValue(entry.translatedText);
    }, [entry.translatedText]);

    useEffect(() => {
      autoResize(englishTextRef.current);
      autoResize(translationTextRef.current);
    }, [entry.englishText, localValue]);

    const getStatusColor = (status: TranslationEntry['status'], isInvalid?: boolean): string => {
      if (isInvalid) return colors.error;
      
      switch (status) {
        case 'missing':
          return colors.error;
        case 'same':
          return colors.warning;
        case 'translated':
          return colors.success;
        default:
          return colors.textMuted;
      }
    };

    const statusColor = getStatusColor(entry.status, entry.isInvalid);

    const styles = {
      container: {
        marginBottom: isMobile ? spacing.lg : spacing.xl,
        padding: isMobile ? spacing.md : isMedium ? '0.875rem' : spacing.lg,
        backgroundColor: colors.bgPrimary,
        borderRadius: borderRadius.xl,
        border: `1px solid ${statusColor}33`,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
      },
      key: {
        fontSize: isMobile ? fontSize.sm : fontSize.md,
        color: colors.textMuted,
        fontFamily: 'monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: isMobile ? 'nowrap' : 'normal',
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? spacing.sm : spacing.lg,
      },
      textArea: {
        ...textAreaStyles.base,
        padding: isMobile ? '0.625rem' : isMedium ? '0.7rem' : spacing.md,
        fontSize: isMobile ? fontSize.md : isMedium ? fontSize.base : fontSize.lg,
      },
      englishTextArea: {
        backgroundColor: colors.bgSecondary,
        color: colors.textSecondary,
        border: `1px solid ${colors.borderPrimary}`,
      },
      translationTextArea: {
        backgroundColor: colors.bgTertiary,
        color: statusColor,
        border: `1px solid ${statusColor}66`,
      },
      invalidBadge: {
        ...badgeStyles.base,
        ...badgeStyles.variants.error,
      },
    };

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.key as React.CSSProperties}>{entry.key}</div>
          {entry.isInvalid && (
            <span style={styles.invalidBadge}>Invalid format specifiers</span>
          )}
        </div>
        
        <div style={styles.grid}>
          <textarea
            ref={englishTextRef}
            value={entry.englishText}
            readOnly
            tabIndex={-1}
            style={{ ...styles.textArea, ...styles.englishTextArea }}
            placeholder="English (Base)"
          />
          
          <textarea
            ref={translationTextRef}
            value={localValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalValue(newValue);
              autoResize(e.target);
            }}
            onFocus={(e) => {
              e.target.select();
              if (onFocusEntry) onFocusEntry(entry.section, entry.key);
            }}
            onBlur={() => {
              onTranslationChange(entry.section, entry.key, localValue);
              if (onBlurEntry) onBlurEntry();
            }}
            style={{ ...styles.textArea, ...styles.translationTextArea }}
            placeholder="Translation"
          />
        </div>
      </div>
    );
  }
);

TranslationRow.displayName = 'TranslationRow';

export default TranslationRow;