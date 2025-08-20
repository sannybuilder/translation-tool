import React from 'react';
import Button from './ui/Button';
import { colors, spacing, fontSize } from '../styles/theme';

interface GitHubErrorViewProps {
  error: string;
  onSwitchToLocal: () => void;
  onRetry: () => void;
}

const GitHubErrorView: React.FC<GitHubErrorViewProps> = ({ 
  error, 
  onSwitchToLocal, 
  onRetry 
}) => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      padding: spacing.xxl,
      color: colors.textPrimary,
    },
    content: {
      maxWidth: '500px',
      textAlign: 'center' as const,
    },
    icon: {
      fontSize: '4rem',
      marginBottom: spacing.lg,
      opacity: 0.8,
    },
    title: {
      fontSize: fontSize.xxxl,
      marginBottom: spacing.lg,
      color: colors.textPrimary,
    },
    error: {
      color: colors.warning,
      marginBottom: spacing.xl,
      fontSize: fontSize.lg,
      lineHeight: 1.5,
    },
    buttons: {
      display: 'flex',
      gap: spacing.lg,
      justifyContent: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>⚠️</div>
        <h2 style={styles.title}>GitHub Connection Failed</h2>
        <p style={styles.error}>{error}</p>
        <div style={styles.buttons}>
          <Button
            variant="primary"
            size="large"
            onClick={onSwitchToLocal}
            title="Switch to local files mode"
          >
            Switch to Local Files
          </Button>
          <Button
            variant="secondary"
            size="large"
            onClick={onRetry}
            title="Retry loading from GitHub"
          >
            Retry GitHub
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GitHubErrorView;