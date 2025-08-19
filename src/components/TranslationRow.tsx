import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { TranslationEntry } from '../types/translation';

interface TranslationRowProps {
  entry: TranslationEntry;
  onTranslationChange: (section: string, key: string, value: string) => void;
  screenSize?: 'mobile' | 'medium' | 'desktop';
  onFocusEntry?: (section: string, key: string) => void;
  onBlurEntry?: () => void;
}

const TranslationRow = forwardRef<HTMLTextAreaElement, TranslationRowProps>(({ entry, onTranslationChange, screenSize = 'desktop', onFocusEntry, onBlurEntry }, ref) => {
  const englishTextRef = useRef<HTMLTextAreaElement>(null);
  const translationTextRef = useRef<HTMLTextAreaElement>(null);
  
  // Use local state for the textarea value to avoid re-renders during typing
  const [localValue, setLocalValue] = useState(entry.translatedText);
  
  const isMobile = screenSize === 'mobile';
  const isMedium = screenSize === 'medium';
  
  // Expose the translation textarea ref to parent
  useImperativeHandle(ref, () => translationTextRef.current!, []);

  const autoResize = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Update local value when entry changes from external source
  useEffect(() => {
    setLocalValue(entry.translatedText);
  }, [entry.translatedText]);

  useEffect(() => {
    autoResize(englishTextRef.current);
    autoResize(translationTextRef.current);
  }, [entry.englishText, localValue]);

  const getStatusColor = (status: TranslationEntry['status'], isInvalid?: boolean) => {
    // Invalid entries are always red, regardless of status
    if (isInvalid) {
      return '#ff4444';
    }
    
    switch (status) {
      case 'missing':
        return '#ff4444';
      case 'same':
        return '#ff9800';
      case 'translated':
        return '#4CAF50';
      default:
        return '#888';
    }
  };

  return (
    <div style={{
      marginBottom: isMobile ? '1rem' : '1.5rem',
      padding: isMobile ? '0.75rem' : isMedium ? '0.875rem' : '1rem',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: `1px solid ${getStatusColor(entry.status, entry.isInvalid)}33`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: '#888',
          fontFamily: 'monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: isMobile ? 'nowrap' : 'normal'
        }}>
          {entry.key}
        </div>
        {entry.isInvalid && (
          <span style={{
            backgroundColor: '#ff4444',
            color: '#fff',
            padding: '0.125rem 0.375rem',
            borderRadius: '3px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            Invalid format specifiers
          </span>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : isMedium ? '1fr 1fr' : '1fr 1fr', 
        gap: isMobile ? '0.75rem' : isMedium ? '0.875rem' : '1rem' 
      }}>
        <textarea
          ref={englishTextRef}
          value={entry.englishText}
          readOnly
          tabIndex={-1}  // Skip this field when tabbing
          style={{
            backgroundColor: '#2a2a2a',
            color: '#aaa',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: isMobile ? '0.625rem' : isMedium ? '0.7rem' : '0.75rem',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'inherit',
            fontSize: isMobile ? '0.875rem' : isMedium ? '0.9rem' : '0.95rem',
            width: '100%',
            lineHeight: '1.5'
          }}
          placeholder="English text"
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
            // Select all text when focusing the field
            e.target.select();
            if (onFocusEntry) onFocusEntry(entry.section, entry.key);
          }}
          onBlur={() => {
            // Save only when leaving the field
            onTranslationChange(entry.section, entry.key, localValue);
            if (onBlurEntry) onBlurEntry();
          }}
          style={{
            backgroundColor: '#2a2a2a',
            color: getStatusColor(entry.status, entry.isInvalid),
            border: `1px solid ${getStatusColor(entry.status, entry.isInvalid)}66`,
            borderRadius: '4px',
            padding: isMobile ? '0.625rem' : isMedium ? '0.7rem' : '0.75rem',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'inherit',
            fontSize: isMobile ? '0.875rem' : isMedium ? '0.9rem' : '0.95rem',
            transition: 'border-color 0.3s ease',
            width: '100%',
            lineHeight: '1.5'
          }}
          placeholder="Translation"
        />
      </div>
    </div>
  );
});

TranslationRow.displayName = 'TranslationRow';

export default TranslationRow;
