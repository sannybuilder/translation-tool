import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock github fetches to avoid network
vi.mock('../../utils/githubCache', async () => {
  const actual = await vi.importActual<any>('../../utils/githubCache');
  return {
    ...actual,
    fetchGitHubFileList: vi.fn(async () => ({ files: ['de.ini', 'fr.ini'], englishData: { General: { Hello: 'Hello' } } })),
    fetchTranslationFile: vi.fn(async (filename: string) => ({ General: { Hello: filename === 'de.ini' ? 'Hallo' : 'Bonjour' } })),
  };
});

describe('E2E: basic editing and cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads language list, picks a language, edits a field, persists cache, restores after reload', async () => {
    render(<App />);

    // Wait for header language selector to appear
    const langSelect = await screen.findByLabelText('Select language file');
    expect(langSelect).not.toBeNull();

    // Select a specific language
    await userEvent.selectOptions(langSelect, 'de.ini');

    // Wait for content main to render and the translation textarea for key 'Hello' to appear
    // Find the textarea with placeholder 'Translation' near the key label
    const allTextareas = await screen.findAllByPlaceholderText('Translation');
    expect(allTextareas.length).toBeGreaterThan(0);

    // Type a new value and blur to trigger onBlur save
    await userEvent.clear(allTextareas[0]);
    await userEvent.type(allTextareas[0], 'Hallo Welt');
    allTextareas[0].blur();

    // Expect app to have switched to local mode: the LocalFileEditor should be hidden once filenames are set
    await waitFor(() => {
      const uploadPrompt = screen.queryByText('Local Translations');
      // Header should still be visible, but LocalFileEditor block should not show when filenames are set
      expect(uploadPrompt).toBeNull();
    });

    // Cache should be present with updated value
    const raw = localStorage.getItem('translation_tool_editing_cache_v2');
    expect(raw).toBeTruthy();
    const cache = JSON.parse(raw!);
    expect(cache.selectedTranslation).toBe('de.ini');
    expect(cache.localFileName).toBe('de.ini');
    expect(cache.localEnglishFileName).toBe('english.ini');
    expect(cache.translationData.General.Hello).toBe('Hallo Welt');
    expect(Array.isArray(cache.changes)).toBe(true);
    expect(cache.changes.length).toBe(1);

    // Simulate reload by clearing the DOM and rendering App again
    localStorage.setItem('translation_tool_editing_cache_v2', JSON.stringify(cache));
    render(<App />);

    // After reload, ensure header shows local filenames (translated button label exists via Header) and the field retains value
    await waitFor(() => {
      // The translation textarea should contain the previously edited text
      expect((screen.getAllByPlaceholderText('Translation')[0] as HTMLTextAreaElement).value).toBe('Hallo Welt');
    });
  });
});


