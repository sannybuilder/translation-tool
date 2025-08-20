import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    availableTranslations: ['en.ini', 'de.ini', 'fr.ini'],
    selectedTranslation: 'de.ini',
    onTranslationChange: vi.fn(),
    totalKeys: 100,
    untranslatedKeys: 25,
    invalidKeys: 5,
    filterMode: 'all' as const,
    onFilterChange: vi.fn(),
    sourceMode: 'github' as const,
    onSourceModeChange: vi.fn(),
    localFileName: '',
    localEnglishFileName: '',
    onEnglishFileUpload: vi.fn(),
    onTranslationFileUpload: vi.fn(),
    screenSize: 'desktop' as const,
    pendingChanges: 3,
    onReviewChangesClick: vi.fn(),
  };

  it('renders basic header elements', () => {
    render(<Header {...defaultProps} />);
    
    // Check that basic elements are present
    expect(screen.getByText(/Translation/i)).toBeTruthy();
    expect(screen.getByText(/Tool/i)).toBeTruthy();
    expect(screen.getByText(/Source/i)).toBeTruthy();
    expect(screen.getByText(/Language/i)).toBeTruthy();
  });

  it('shows review changes button when pending changes exist', () => {
    render(<Header {...defaultProps} pendingChanges={3} hasActiveCache={true} />);
    const reviewButton = screen.getByTestId('review-changes-btn');
    expect(reviewButton).toBeTruthy();
  });

  it('shows review changes button even with 0 pending changes when there is active cache', () => {
    render(<Header {...defaultProps} pendingChanges={0} hasActiveCache={true} />);
    const reviewButton = screen.getByTestId('review-changes-btn');
    expect(reviewButton).toBeTruthy();
  });

  it('does not show review changes button when there is no active cache', () => {
    render(<Header {...defaultProps} hasActiveCache={false} />);
    const reviewButton = screen.queryByTestId('review-changes-btn');
    expect(reviewButton).toBeNull();
  });

  it('shows cached indicator when using GitHub cache', () => {
    render(<Header {...defaultProps} isUsingCache={true} />);
    expect(screen.getByText(/GitHub \(cached\)/i)).toBeTruthy();
  });
});
