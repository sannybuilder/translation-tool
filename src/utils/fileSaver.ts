import { serializeIni } from './iniParser';
import { getEncodingByLangId, encodeTextWithEncoding } from './githubCache';
import type { IniData } from './iniParser';

interface SaveFileOptions {
  translationData: IniData;
  englishData: IniData;
  sourceMode: 'github' | 'local';
  selectedTranslation?: string;
  localFileName?: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

export const saveTranslationFile = ({
  translationData,
  englishData,
  sourceMode,
  selectedTranslation,
  localFileName,
}: SaveFileOptions): SaveResult => {
  try {
    const content = serializeIni(translationData, englishData);
    
    // Extract LANGID from the translation data to determine encoding
    const langId = translationData['']?.['LANGID'];
    
    if (!langId) {
      return {
        success: false,
        error: 'Cannot save: No LANGID found in file. LANGID is required to determine proper ANSI encoding.',
      };
    }

    const encoding = getEncodingByLangId(langId);
    
    if (!encoding) {
      return {
        success: false,
        error: `Cannot save: Unknown LANGID ${langId}. Unable to determine proper ANSI encoding.`,
      };
    }

    // Encode the content with the appropriate encoding
    let blob: Blob;
    
    try {
      const encodedData = encodeTextWithEncoding(content, encoding);
      blob = new Blob([encodedData], {
        type: `text/plain;charset=${encoding}`,
      });
      console.log(`Saving file with encoding: ${encoding} for LANGID: ${langId}`);
    } catch (error) {
      console.error('Failed to encode file:', error);
      return {
        success: false,
        error: `Failed to encode file with ${encoding} encoding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sourceMode === 'github' ? selectedTranslation || 'translation.ini' : localFileName || 'translation.ini';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save file',
    };
  }
};

export const downloadPatch = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
