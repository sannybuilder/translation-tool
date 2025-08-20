import { useMemo } from 'react';
import { countFormatSpecifiers } from '../utils/iniParser';
import type { IniData } from '../utils/iniParser';
import type { TranslationEntry } from '../types/translation';

interface TranslationStats {
  entries: TranslationEntry[];
  stats: {
    total: number;
    untranslated: number;
    invalid: number;
  };
  groupedEntries: Record<string, TranslationEntry[]>;
  sectionStats: Record<string, { total: number; untranslated: number; invalid: number }>;
}

export const useTranslationStats = (
  englishData: IniData,
  translationData: IniData
): TranslationStats => {
  return useMemo(() => {
    const processedEntries: TranslationEntry[] = [];
    let untranslatedCount = 0;
    let invalidCount = 0;

    Object.keys(englishData).forEach((section) => {
      // Skip the root section (empty string) which contains LANGID
      if (section === '') return;

      Object.keys(englishData[section]).forEach((key) => {
        const englishText = englishData[section][key];
        const translatedText = translationData[section]?.[key] || '';

        let status: TranslationEntry['status'] = 'translated';
        if (!translatedText) {
          status = 'missing';
          untranslatedCount++;
        } else if (translatedText === englishText) {
          status = 'same';
          untranslatedCount++;
        }

        // Check if format specifiers match
        let isInvalid = false;
        if (translatedText && status === 'translated') {
          const englishSpecifiers = countFormatSpecifiers(englishText);
          const translationSpecifiers = countFormatSpecifiers(translatedText);

          if (
            englishSpecifiers.percentD !== translationSpecifiers.percentD ||
            englishSpecifiers.percentS !== translationSpecifiers.percentS ||
            englishSpecifiers.newLines !== translationSpecifiers.newLines
          ) {
            isInvalid = true;
            invalidCount++;
          }
        }

        processedEntries.push({
          section,
          key,
          englishText,
          translatedText,
          status,
          isInvalid,
        });
      });
    });

    // Group entries by section
    const groupedEntries = processedEntries.reduce((acc, entry) => {
      if (!acc[entry.section]) {
        acc[entry.section] = [];
      }
      acc[entry.section].push(entry);
      return acc;
    }, {} as Record<string, TranslationEntry[]>);

    // Compute per-section statistics
    const sectionStats = processedEntries.reduce((acc, entry) => {
      if (!acc[entry.section]) {
        acc[entry.section] = { total: 0, untranslated: 0, invalid: 0 };
      }
      acc[entry.section].total += 1;
      if (entry.status === 'missing' || entry.status === 'same') {
        acc[entry.section].untranslated += 1;
      }
      if (entry.isInvalid) {
        acc[entry.section].invalid += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; untranslated: number; invalid: number }>);

    return {
      entries: processedEntries,
      stats: {
        total: processedEntries.length,
        untranslated: untranslatedCount,
        invalid: invalidCount,
      },
      groupedEntries,
      sectionStats,
    };
  }, [englishData, translationData]);
};
