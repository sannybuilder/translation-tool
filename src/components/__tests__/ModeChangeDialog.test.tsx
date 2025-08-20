import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModeChangeDialog from '../ModeChangeDialog';

describe('ModeChangeDialog', () => {
  const defaultProps = {
    visible: true,
    currentMode: 'github' as const,
    pendingMode: 'local' as const,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    hasChanges: false,
    pendingChangesCount: 0,
  };

  it('renders basic dialog structure', () => {
    render(<ModeChangeDialog {...defaultProps} />);
    
    // Just check that the component renders without crashing
    expect(screen.getByText(/Warning/i)).toBeTruthy();
  });

  it('shows warning when pendingChangesCount > 0', () => {
    render(<ModeChangeDialog {...defaultProps} pendingChangesCount={3} />);
    expect(screen.getByText(/3 pending changes/i)).toBeTruthy();
  });
});
