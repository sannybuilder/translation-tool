import { useState, useCallback } from 'react';
import { readLocalFile } from '../utils/githubCache';
import type { IniData } from '../utils/iniParser';

interface FileHandlerState {
  englishData: IniData;
  translationData: IniData;
  originalTranslationData: IniData;
  localFileName: string;
  localEnglishFileName: string;
  error: string | null;
  loading: boolean;
}

export const useFileHandler = () => {
  const [state, setState] = useState<FileHandlerState>({
    englishData: {},
    translationData: {},
    originalTranslationData: {},
    localFileName: '',
    localEnglishFileName: '',
    error: null,
    loading: false,
  });

  const handleEnglishFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const parsed = await readLocalFile(file);
      setState(prev => ({
        ...prev,
        englishData: parsed,
        localEnglishFileName: file.name,
        loading: false,
      }));
    } catch (err) {
      console.error('Error loading local English file:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to load English file',
        loading: false,
      }));
    }
  }, []);

  const handleTranslationFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const parsed = await readLocalFile(file);
      setState(prev => ({
        ...prev,
        translationData: parsed,
        originalTranslationData: JSON.parse(JSON.stringify(parsed)),
        localFileName: file.name,
        loading: false,
      }));
    } catch (err) {
      console.error('Error loading local translation file:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to load translation file',
        loading: false,
      }));
    }
  }, []);

  const handleFilesLoaded = useCallback((
    englishData: IniData,
    translationData: IniData,
    englishFileName: string,
    translationFileName: string,
  ) => {
    setState(prev => {
      const newState = { ...prev, error: null };
      
      if (Object.keys(englishData).length > 0) {
        newState.englishData = englishData;
      }
      
      if (Object.keys(translationData).length > 0) {
        newState.translationData = translationData;
        newState.originalTranslationData = JSON.parse(JSON.stringify(translationData));
      }
      
      if (englishFileName) {
        newState.localEnglishFileName = englishFileName;
      }
      
      if (translationFileName) {
        newState.localFileName = translationFileName;
      }
      
      return newState;
    });
  }, []);

  const handleGitHubBaseFileLoad = useCallback((englishData: IniData, englishFileName: string) => {
    setState(prev => ({
      ...prev,
      englishData,
      localEnglishFileName: englishFileName,
      error: null,
    }));
  }, []);

  const resetFiles = useCallback(() => {
    setState({
      englishData: {},
      translationData: {},
      originalTranslationData: {},
      localFileName: '',
      localEnglishFileName: '',
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    handleEnglishFileUpload,
    handleTranslationFileUpload,
    handleFilesLoaded,
    handleGitHubBaseFileLoad,
    resetFiles,
  };
};
