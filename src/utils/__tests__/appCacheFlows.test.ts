import { describe, it, expect } from 'vitest';
import { buildEditingCacheSnapshot } from '../sessionManager';

describe('Cache snapshot helper', () => {
  it('fills in filenames when missing', () => {
    const snap = buildEditingCacheSnapshot({
      selectedTranslation: 'de.ini',
      englishData: {},
      originalTranslationData: {},
      translationData: {},
      changes: [],
    });
    expect(snap.localFileName).toBe('de.ini');
    expect(snap.localEnglishFileName).toBe('english.ini');
  });

  it('respects provided filenames', () => {
    const snap = buildEditingCacheSnapshot({
      selectedTranslation: 'de.ini',
      localFileName: 'my-de.ini',
      localEnglishFileName: 'base.ini',
      englishData: {},
      originalTranslationData: {},
      translationData: {},
      changes: [],
    });
    expect(snap.localFileName).toBe('my-de.ini');
    expect(snap.localEnglishFileName).toBe('base.ini');
  });
});


