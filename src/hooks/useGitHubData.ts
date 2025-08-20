import { useState, useEffect, useCallback } from 'react';
import {
  getCachedData,
  setCachedData,
  fetchGitHubFileList,
  fetchTranslationFile,
} from '../utils/githubCache';
import type { IniData } from '../utils/iniParser';

interface GitHubDataState {
  availableTranslations: string[];
  englishData: IniData;
  translationData: IniData;
  originalTranslationData: IniData;
  isUsingCache: boolean;
  githubInitiallyFailed: boolean;
  hasInitiallyLoaded: boolean;
  loading: boolean;
  error: string | null;
}

export const useGitHubData = (
  sourceMode: 'github' | 'local',
  selectedTranslation: string,
  hasCheckedSession: boolean
) => {
  const [state, setState] = useState<GitHubDataState>({
    availableTranslations: [],
    englishData: {},
    translationData: {},
    originalTranslationData: {},
    isUsingCache: false,
    githubInitiallyFailed: false,
    hasInitiallyLoaded: false,
    loading: true,
    error: null,
  });

  // Fetch available translations
  const fetchAvailableTranslations = useCallback(async () => {
    if (sourceMode !== 'github' || !hasCheckedSession) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // After initial load, always use cache when switching between modes
    if (state.hasInitiallyLoaded) {
      const cachedFileList = getCachedData<string[]>('github_file_list');
      const cachedEnglishData = getCachedData<IniData>('english_ini');

      if (cachedFileList && cachedEnglishData) {
        console.log('Using cached data (mode switch after initial load)');
        setState(prev => ({
          ...prev,
          isUsingCache: state.githubInitiallyFailed,
          error: state.githubInitiallyFailed ? 'GitHub unavailable. Using cached data.' : null,
          availableTranslations: cachedFileList,
          englishData: cachedEnglishData,
          loading: false,
        }));
        return;
      }
    }

    // Initial load or no cache available - try to fetch fresh data
    try {
      console.log('Attempting to fetch fresh data from GitHub');
      const { files: iniFiles, englishData } = await fetchGitHubFileList();

      // Success! Update cache with fresh data
      console.log('Successfully fetched fresh data from GitHub');
      setCachedData('github_file_list', iniFiles);
      setCachedData('english_ini', englishData);

      setState(prev => ({
        ...prev,
        isUsingCache: false,
        githubInitiallyFailed: false,
        availableTranslations: iniFiles,
        englishData,
        hasInitiallyLoaded: true,
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error('Error fetching from GitHub, attempting to use cache:', err);

      // GitHub failed, try to load from cache
      const cachedFileList = getCachedData<string[]>('github_file_list');
      const cachedEnglishData = getCachedData<IniData>('english_ini');

      if (cachedFileList && cachedEnglishData) {
        console.log('Using cached data (GitHub unavailable)');
        setState(prev => ({
          ...prev,
          isUsingCache: true,
          githubInitiallyFailed: true,
          availableTranslations: cachedFileList,
          englishData: cachedEnglishData,
          hasInitiallyLoaded: true,
          loading: false,
          error: 'GitHub unavailable. Using cached data.',
        }));
      } else {
        // No cache available, show error
        const errorMessage =
          err instanceof Error
            ? `${err.message} Please try again or use local files.`
            : 'Failed to load translations from GitHub. Please try again or use local files.';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    }
  }, [sourceMode, hasCheckedSession, state.hasInitiallyLoaded, state.githubInitiallyFailed]);

  // Load selected translation
  const loadTranslation = useCallback(async () => {
    if (!selectedTranslation || sourceMode !== 'github' || !hasCheckedSession) {
      return;
    }

    const cacheKey = `translation_${selectedTranslation}`;

    // After initial load, always use cache when available
    if (state.hasInitiallyLoaded) {
      const cachedTranslation = getCachedData<IniData>(cacheKey);

      if (cachedTranslation) {
        console.log(`Using cached data for ${selectedTranslation} (mode switch after initial load)`);
        setState(prev => ({
          ...prev,
          translationData: cachedTranslation,
          originalTranslationData: JSON.parse(JSON.stringify(cachedTranslation)),
          error: null,
        }));
        return;
      }
    }

    // Initial load or no cache - try to fetch fresh data
    try {
      console.log(`Attempting to fetch fresh data for ${selectedTranslation}`);
      const parsed = await fetchTranslationFile(selectedTranslation);

      // Success! Update cache with fresh data
      console.log(`Successfully fetched fresh data for ${selectedTranslation}`);
      setCachedData(cacheKey, parsed);

      setState(prev => ({
        ...prev,
        translationData: parsed,
        originalTranslationData: JSON.parse(JSON.stringify(parsed)),
        error: null,
      }));
    } catch (error) {
      console.error(`Error fetching ${selectedTranslation} from GitHub, attempting to use cache:`, error);

      // GitHub failed, try to load from cache
      const cachedTranslation = getCachedData<IniData>(cacheKey);

      if (cachedTranslation) {
        console.log(`Using cached data for ${selectedTranslation} (GitHub unavailable)`);
        setState(prev => ({
          ...prev,
          translationData: cachedTranslation,
          originalTranslationData: JSON.parse(JSON.stringify(cachedTranslation)),
          error: 'GitHub unavailable. Using cached data.',
        }));
      } else {
        // No cache available, show error
        const errorMessage =
          error instanceof Error
            ? `${error.message} Please try again or switch to local files.`
            : `Failed to load ${selectedTranslation}. Please try again or switch to local files.`;
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
      }
    }
  }, [selectedTranslation, sourceMode, hasCheckedSession, state.hasInitiallyLoaded]);

  // Fetch translations on mount/mode change
  useEffect(() => {
    fetchAvailableTranslations();
  }, [fetchAvailableTranslations]);

  // Load selected translation when it changes
  useEffect(() => {
    loadTranslation();
  }, [loadTranslation]);

  return {
    ...state,
    refetch: fetchAvailableTranslations,
  };
};
