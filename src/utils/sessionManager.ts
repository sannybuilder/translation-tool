import type { EditingCache } from '../types/workCache';

// Use a new key and ignore any legacy keys
const CACHE_KEY = 'translation_tool_editing_cache_v2';

export const saveEditingCache = (data: EditingCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, lastEditedAt: Date.now() }));
  } catch (error) {
    console.error('Failed to save editing cache:', error);
  }
};

export const loadEditingCache = (): EditingCache | null => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? (JSON.parse(saved) as EditingCache) : null;
  } catch (error) {
    console.error('Failed to load editing cache:', error);
    return null;
  }
};

export const clearEditingCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear editing cache:', error);
  }
};

export const hasEditingCache = (): boolean => {
  return localStorage.getItem(CACHE_KEY) !== null;
};

export function buildEditingCacheSnapshot(args: {
  selectedTranslation: string;
  localFileName?: string;
  localEnglishFileName?: string;
  englishData: EditingCache['englishData'];
  originalTranslationData: EditingCache['originalTranslationData'];
  translationData: EditingCache['translationData'];
  changes: EditingCache['changes'];
}): EditingCache {
  const ensuredLocalFileName = args.localFileName && args.localFileName.length > 0
    ? args.localFileName
    : (args.selectedTranslation || 'translation.ini');
  const ensuredLocalEnglish = args.localEnglishFileName && args.localEnglishFileName.length > 0
    ? args.localEnglishFileName
    : 'english.ini';

  return {
    source: 'local',
    selectedTranslation: args.selectedTranslation,
    localFileName: ensuredLocalFileName,
    localEnglishFileName: ensuredLocalEnglish,
    englishData: args.englishData,
    originalTranslationData: args.originalTranslationData,
    translationData: args.translationData,
    changes: args.changes,
    lastEditedAt: Date.now(),
  };
}

