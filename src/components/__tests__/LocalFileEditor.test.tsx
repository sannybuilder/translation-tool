import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocalFileEditor from '../LocalFileEditor';

describe('LocalFileEditor', () => {
  const defaultProps = {
    onFilesLoaded: vi.fn(),
    onError: vi.fn(),
    localEnglishFileName: '',
    localFileName: '',
    onEnglishFileUpload: vi.fn(),
    onTranslationFileUpload: vi.fn(),
    onGitHubBaseFileLoad: vi.fn(),
  };

  it('renders basic component structure', () => {
    render(<LocalFileEditor {...defaultProps} />);
    
    // Check that the component renders without crashing
    expect(screen.getByText(/Load Translation Files/i)).toBeTruthy();
    expect(screen.getByText(/Choose how to load your files/i)).toBeTruthy();
    expect(screen.getByText(/or drag & drop INI files anywhere in this area/i)).toBeTruthy();
  });

  it('renders step headers', () => {
    render(<LocalFileEditor {...defaultProps} />);
    
    const step1Headers = screen.getAllByText(/Step 1: Select Base File/i);
    expect(step1Headers[0]).toBeTruthy();
    const step2Headers = screen.getAllByText(/Step 2: Select Translation File/i);
    expect(step2Headers[0]).toBeTruthy();
  });

  it('renders GitHub base file loading option when no base file is loaded', () => {
    render(<LocalFileEditor {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button', { name: /Load from GitHub/i });
    expect(buttons[0]).toBeTruthy();
    const descriptions = screen.getAllByText(/Official english.ini/i);
    expect(descriptions[0]).toBeTruthy();
  });

     it('renders file upload buttons', () => {
     render(<LocalFileEditor {...defaultProps} />);
     
     const baseButtons = screen.getAllByText(/Open Local File/i);
     expect(baseButtons[0]).toBeTruthy();
     const translationButtons = screen.getAllByText(/Open Local File/i);
     expect(translationButtons[1]).toBeTruthy();
     const baseHints = screen.getAllByText(/english.ini/i);
     expect(baseHints[0]).toBeTruthy();
     const translationHints = screen.getAllByText(/Your language.ini file/i);
     expect(translationHints[0]).toBeTruthy();
   });
});
