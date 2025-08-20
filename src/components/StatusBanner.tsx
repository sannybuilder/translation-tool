import React from 'react';
import Button from './ui/Button';
import { colors, spacing, fontSize } from '../styles/theme';

interface StatusBannerProps {
  error: string;
  isUsingCache?: boolean;
  onSwitchToLocal: () => void;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ 
  error, 
  isUsingCache = false, 
  onSwitchToLocal 
}) => {
  const styles = {
    container: {
      backgroundColor: isUsingCache ? colors.primaryLight : `${colors.warning}1a`,
      color: isUsingCache ? colors.success : colors.warning,
      padding: `${spacing.lg} ${spacing.xxl}`,
      borderBottom: `1px solid ${isUsingCache ? colors.success : colors.warning}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
      gap: spacing.lg,
    },
    message: {
      fontSize: fontSize.base,
    },
  };

  return (
    <div style={styles.container}>
      <span style={styles.message}>{error}</span>
      {!isUsingCache && (
        <Button
          variant="primary"
          size="small"
          onClick={onSwitchToLocal}
          title="Switch to Local Mode"
          customStyle={{
            backgroundColor: colors.warning,
            color: '#000',
            fontWeight: 'bold',
          }}
        >
          Switch to Local Mode
        </Button>
      )}
    </div>
  );
};

export default StatusBanner;