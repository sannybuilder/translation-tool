import { describe, it, expect, beforeEach } from 'vitest';
import { saveEditingCache, loadEditingCache, clearEditingCache, hasEditingCache } from '../sessionManager';
import type { EditingCache } from '../../types/workCache';

describe('sessionManager unified editing cache', () => {
  beforeEach(() => {
    // reset storage before each test
    localStorage.clear();
  });

  const makeCache = (): EditingCache => ({
    source: 'local',
    selectedTranslation: 'de.ini',
    localFileName: 'de.ini',
    localEnglishFileName: 'english.ini',
    englishData: { General: { Hello: 'Hello' } },
    originalTranslationData: { General: { Hello: 'Hallo' } },
    translationData: { General: { Hello: 'Hallo Welt' } },
    changes: [
      {
        id: 'General-Hello',
        section: 'General',
        key: 'Hello',
        originalValue: 'Hallo',
        newValue: 'Hallo Welt',
        timestamp: Date.now(),
        submitted: false,
      },
    ],
    lastEditedAt: Date.now(),
  });

  it('saves and loads the editing cache', () => {
    const cache = makeCache();
    expect(hasEditingCache()).toBe(false);
    expect(loadEditingCache()).toBeNull();

    saveEditingCache(cache);
    expect(hasEditingCache()).toBe(true);
    const loaded = loadEditingCache();
    expect(loaded).not.toBeNull();
    expect(loaded!.selectedTranslation).toBe('de.ini');
    expect(loaded!.translationData.General.Hello).toBe('Hallo Welt');
    expect(loaded!.changes.length).toBe(1);
  });

  it('clears the cache', () => {
    const cache = makeCache();
    saveEditingCache(cache);
    expect(hasEditingCache()).toBe(true);
    clearEditingCache();
    expect(hasEditingCache()).toBe(false);
    expect(loadEditingCache()).toBeNull();
  });
});


