import type { IniData } from '../utils/iniParser';
import type { TrackedChange } from './changeTracking';

export interface EditingCache {
  source: 'local';
  selectedTranslation: string;
  localFileName: string;
  localEnglishFileName: string;
  englishData: IniData;
  originalTranslationData: IniData;
  translationData: IniData;
  changes: TrackedChange[];
  lastEditedAt: number;
}


