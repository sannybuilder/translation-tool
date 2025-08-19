export interface SessionData {
  timestamp: number;
  sourceMode: 'github' | 'local';
  selectedTranslation: string;
  localFileName: string;
  localEnglishFileName: string;
  englishData: Record<string, Record<string, string>>;
  translationData: Record<string, Record<string, string>>;
  originalTranslationData: Record<string, Record<string, string>>;
  availableTranslations: string[];
}

export interface SessionState {
  hasSession: boolean;
  lastSaveTime: number | null;
  isAutoSaving: boolean;
}
