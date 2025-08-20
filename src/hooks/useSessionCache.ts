import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  saveEditingCache, 
  loadEditingCache, 
  clearEditingCache, 
  hasEditingCache,
  buildEditingCacheSnapshot 
} from '../utils/sessionManager';
import type { IniData } from '../utils/iniParser';
import type { ChangeTracker } from '../utils/changeTracker';

interface SessionCacheHookProps {
  selectedTranslation: string;
  localFileName: string;
  localEnglishFileName: string;
  englishData: IniData;
  originalTranslationData: IniData;
  translationData: IniData;
  changeTracker: ChangeTracker | null;
}

export const useSessionCache = ({
  selectedTranslation,
  localFileName,
  localEnglishFileName,
  englishData,
  originalTranslationData,
  translationData,
  changeTracker,
}: SessionCacheHookProps) => {
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [isRestoringFromCache, setIsRestoringFromCache] = useState(false);
  const hasCheckedCacheRef = useRef<boolean>(false);
  const appliedCacheToTrackerRef = useRef<boolean>(false);

  // Load cache on mount
  const loadFromCache = useCallback(() => {
    if (hasCheckedCacheRef.current) return null;
    
    const cache = loadEditingCache();
    hasCheckedCacheRef.current = true;
    setHasCheckedSession(true);
    
    if (cache) {
      setIsRestoringFromCache(true);
    }
    
    return cache;
  }, []);

  // Save to cache
  const saveToCache = useCallback(() => {
    if (selectedTranslation) {
      const snapshot = buildEditingCacheSnapshot({
        selectedTranslation,
        localFileName,
        localEnglishFileName,
        englishData,
        originalTranslationData,
        translationData,
        changes: changeTracker?.getUnsubmittedChanges() || [],
      });
      saveEditingCache(snapshot);
    }
  }, [
    selectedTranslation,
    localFileName,
    localEnglishFileName,
    englishData,
    originalTranslationData,
    translationData,
    changeTracker,
  ]);

  // Clear cache
  const clearCache = useCallback(() => {
    clearEditingCache();
  }, []);

  // Check if cache exists
  const hasCachedData = useCallback(() => {
    return hasEditingCache();
  }, []);

  // Apply cache changes to tracker
  useEffect(() => {
    if (!appliedCacheToTrackerRef.current && changeTracker) {
      const cache = loadEditingCache();
      if (cache && cache.changes && cache.selectedTranslation === selectedTranslation) {
        changeTracker.setChangesFromArray(cache.changes);
        appliedCacheToTrackerRef.current = true;
      }
    }
  }, [changeTracker, selectedTranslation]);

  return {
    hasCheckedSession,
    isRestoringFromCache,
    loadFromCache,
    saveToCache,
    clearCache,
    hasCachedData,
  };
};
