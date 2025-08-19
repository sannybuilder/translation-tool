import { parseIni } from './iniParser';
import type { IniData } from './iniParser';

// GitHub configuration
export const GITHUB_REPO = 'sannybuilder/translations';
export const GITHUB_BRANCH = 'master';
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents`;
export const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

// Cache configuration
const CACHE_PREFIX = 'translation_editor_';

// Cache management types
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: string;
}

// Helper function to get cache key
const getCacheKey = (key: string): string => `${CACHE_PREFIX}${key}`;

// Get data from cache
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(getCacheKey(key));
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    return entry.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    // If there's an error reading cache, clear it
    try {
      localStorage.removeItem(getCacheKey(key));
    } catch {
      // Ignore errors when clearing cache
    }
    return null;
  }
}

// Set data in cache
export function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If localStorage is full, we can't do much about it
    // Just log the error and continue
  }
}

// Helper function to get encoding based on LANGID
const getEncodingByLangId = (langId: string): string => {
  const id = parseInt(langId, 10);
  
  // LANGID to encoding mapping
  const langIdMap: { [key: number]: string } = {
    1033: 'windows-1252', // English (US)
    2057: 'windows-1252', // English (UK)
    1031: 'windows-1252', // German (Germany)
    2055: 'windows-1252', // German (Switzerland)
    3079: 'windows-1252', // German (Austria)
    1049: 'windows-1251', // Russian
    2073: 'windows-1251', // Russian (Moldova)
    1058: 'windows-1251', // Ukrainian
    1059: 'windows-1251', // Belarusian
    1067: 'utf-8',        // Armenian (often uses UTF-8)
    1026: 'windows-1251', // Bulgarian
    1071: 'windows-1251', // Macedonian
    1087: 'windows-1251', // Kazakh
    1088: 'windows-1251', // Kyrgyz
    2092: 'windows-1251', // Azerbaijani (Cyrillic)
    1036: 'windows-1252', // French
    1040: 'windows-1252', // Italian
    1034: 'windows-1252', // Spanish
    1029: 'windows-1250', // Czech
    1045: 'windows-1250', // Polish
    1038: 'windows-1250', // Hungarian
    1048: 'windows-1250', // Romanian
    1050: 'windows-1250', // Croatian
    1051: 'windows-1250', // Slovak
    1060: 'windows-1250', // Slovenian
    1032: 'windows-1253', // Greek
    1055: 'windows-1254', // Turkish
    1037: 'windows-1255', // Hebrew
    1025: 'windows-1256', // Arabic
    1054: 'windows-874',  // Thai
    1041: 'shift-jis',    // Japanese
    1042: 'euc-kr',       // Korean
    2052: 'gb18030',      // Chinese (Simplified)
    1028: 'big5',         // Chinese (Traditional)
  };
  
  return langIdMap[id] || 'utf-8';
};

// Helper function to decode text with LANGID-based encoding detection
export async function decodeAnsiText(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  
  // First, try to extract LANGID from the beginning of the file
  const uint8Array = new Uint8Array(buffer);
  const first100Bytes = uint8Array.slice(0, Math.min(100, uint8Array.length));
  
  // Try to decode as ASCII to find LANGID
  let langId = '';
  try {
    const asciiText = new TextDecoder('ascii').decode(first100Bytes);
    const langIdMatch = asciiText.match(/LANGID=(\d+)/);
    if (langIdMatch) {
      langId = langIdMatch[1];
    }
  } catch {
    // Couldn't extract LANGID, will use fallback
  }
  
  // If we found a LANGID, use it to determine encoding
  if (langId) {
    const encoding = getEncodingByLangId(langId);
    try {
      const decoder = new TextDecoder(encoding);
      return decoder.decode(buffer);
    } catch {
      // If the determined encoding fails, fall through to UTF-8
    }
  }
  
  // Fallback: try UTF-8 first (most universal)
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    // Final fallback to Windows-1252 for Western European files
    const win1252Decoder = new TextDecoder('windows-1252');
    return win1252Decoder.decode(buffer);
  }
}

// Fetch only the list of .ini files (excluding english.ini) from GitHub without loading any file contents
export async function fetchGitHubFileNamesOnly(): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(GITHUB_API_URL, {
      signal: controller.signal
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('Connection to GitHub timed out.');
      }
      throw new Error('Cannot connect to GitHub.');
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded.');
      }
      throw new Error(`GitHub returned error ${response.status}.`);
    }

    const files: GitHubFile[] = await response.json();

    // Filter for .ini files excluding english.ini
    const iniFiles = files
      .filter((file) => file.name.endsWith('.ini') && file.name !== 'english.ini')
      .map((file) => file.name)
      .sort();

    return iniFiles;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Fetch file list from GitHub
export async function fetchGitHubFileList(): Promise<{ files: string[], englishData: IniData }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(GITHUB_API_URL, {
      signal: controller.signal
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('Connection to GitHub timed out.');
      }
      throw new Error('Cannot connect to GitHub.');
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded.');
      }
      throw new Error(`GitHub returned error ${response.status}.`);
    }
    
    const files: GitHubFile[] = await response.json();
    
    // Filter for .ini files excluding english.ini
    const iniFiles = files
      .filter((file) => file.name.endsWith('.ini') && file.name !== 'english.ini')
      .map((file) => file.name)
      .sort();
    
    // Load English data from GitHub
    const englishResponse = await fetch(`${GITHUB_RAW_URL}/english.ini`);
    const englishText = await decodeAnsiText(englishResponse);
    const englishData = parseIni(englishText);
    
    return { files: iniFiles, englishData };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Fetch individual translation file from GitHub
export async function fetchTranslationFile(filename: string): Promise<IniData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(`${GITHUB_RAW_URL}/${filename}`, {
      signal: controller.signal
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error(`Loading ${filename} timed out.`);
      }
      throw new Error(`Cannot load ${filename}.`);
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File ${filename} not found on GitHub.`);
      }
      throw new Error(`Failed to load ${filename} (Error ${response.status}).`);
    }
    
    const text = await decodeAnsiText(response);
    return parseIni(text);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Helper function to read local file content with LANGID-based encoding detection
export function readLocalFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      
      // First, try to extract LANGID from the beginning of the file
      const uint8Array = new Uint8Array(buffer);
      const first100Bytes = uint8Array.slice(0, Math.min(100, uint8Array.length));
      
      // Try to decode as ASCII to find LANGID
      let langId = '';
      try {
        const asciiText = new TextDecoder('ascii').decode(first100Bytes);
        const langIdMatch = asciiText.match(/LANGID=(\d+)/);
        if (langIdMatch) {
          langId = langIdMatch[1];
        }
      } catch {
        // Couldn't extract LANGID, will use fallback
      }
      
      // If we found a LANGID, use it to determine encoding
      if (langId) {
        const encoding = getEncodingByLangId(langId);
        try {
          const decoder = new TextDecoder(encoding);
          resolve(decoder.decode(buffer));
          return;
        } catch {
          // If the determined encoding fails, fall through to UTF-8
        }
      }
      
      // Fallback: try UTF-8 first (most universal)
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        resolve(utf8Decoder.decode(buffer));
      } catch {
        // Final fallback to Windows-1252 for Western European files
        const win1252Decoder = new TextDecoder('windows-1252');
        resolve(win1252Decoder.decode(buffer));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
