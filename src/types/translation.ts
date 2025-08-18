export interface TranslationEntry {
  section: string;
  key: string;
  englishText: string;
  translatedText: string;
  status: 'missing' | 'same' | 'translated';
  isInvalid?: boolean; // Indicates if format specifiers don't match
}
