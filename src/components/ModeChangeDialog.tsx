import React, { useEffect } from 'react';
import Button from './ui/Button';
import { colors, spacing, fontSize, borderRadius, shadows } from '../styles/theme';

interface ModeChangeDialogProps {
  visible: boolean;
  currentMode: 'github' | 'local';
  pendingMode: 'github' | 'local' | null;
  onCancel: () => void;
  onConfirm: () => void;
  hasChanges: boolean;
  pendingChangesCount?: number;
}

const ModeChangeDialog: React.FC<ModeChangeDialogProps> = ({
  visible,
  currentMode,
  pendingMode,
  onCancel,
  onConfirm,
  hasChanges,
  pendingChangesCount = 0,
}) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible, onCancel, onConfirm]);

  if (!visible) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    dialog: {
      backgroundColor: colors.bgSecondary,
      borderRadius: borderRadius.xl,
      padding: spacing.xxl,
      maxWidth: '500px',
      width: '90%',
      boxShadow: shadows.xl,
      border: `1px solid ${colors.borderPrimary}`,
    },
    title: {
      margin: `0 0 ${spacing.lg} 0`,
      fontSize: fontSize.xxxl,
      color: colors.textPrimary,
    },
    content: {
      margin: `0 0 ${spacing.lg} 0`,
      fontSize: fontSize.lg,
      color: colors.textLight,
      lineHeight: 1.6,
    },
    warning: {
      margin: `0 0 ${spacing.xl} 0`,
      fontSize: fontSize.base,
      color: colors.warning,
      fontWeight: 'bold' as const,
    },
    hint: {
      margin: `0 0 ${spacing.xl} 0`,
      fontSize: fontSize.md,
      color: colors.textMuted,
      fontStyle: 'italic' as const,
    },
    kbd: {
      padding: '0.1rem 0.3rem',
      backgroundColor: colors.borderPrimary,
      borderRadius: borderRadius.sm,
    },
    buttons: {
      display: 'flex',
      gap: spacing.lg,
      justifyContent: 'flex-end',
    },
  };

  const getTargetModeName = () => {
    return pendingMode === 'github' ? 'GitHub' : 'Local Files';
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h2 style={styles.title}>Switch to {getTargetModeName()}?</h2>
        
        <p style={styles.content}>
          You're switching from <strong>{currentMode === 'github' ? 'GitHub' : 'Local Files'}</strong> to{' '}
          <strong>{getTargetModeName()}</strong>.
        </p>

        {pendingChangesCount > 0 && (
          <p style={styles.warning}>
            ⚠️ You have {pendingChangesCount} pending change{pendingChangesCount !== 1 ? 's' : ''} to review.
          </p>
        )}

        {hasChanges && (
          <p style={styles.warning}>
            ⚠️ You have unsaved changes that will be lost.
          </p>
        )}

        <p style={styles.content}>
          Switching modes will <strong>permanently delete</strong> your current editing session, including:
          • All unsaved edits
          • Pending changes waiting for review
          • Your current working files
        </p>

        <p style={styles.content}>
          Please download or copy your work or submit pending changes first, or confirm to delete the cache.
        </p>

        <p style={styles.hint}>
          Press <kbd style={styles.kbd}>ESC</kbd> to cancel or{' '}
          <kbd style={styles.kbd}>Enter</kbd> to confirm.
        </p>

        <div style={styles.buttons}>
          <Button
            variant="secondary"
            size="medium"
            onClick={onCancel}
            title="Cancel and keep current changes"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="medium"
            onClick={onConfirm}
            title="Switch mode and lose changes"
          >
            Switch Mode (Delete Cache)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModeChangeDialog;