import { parseIni } from './iniParser';
import type { IniData } from './iniParser';
import iconv from 'iconv-lite';
import { getEncodingForLcid } from './localeCodepage';

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
export const getEncodingByLangId = (langId: string): string | null => {
  const id = parseInt(langId, 10);
  
  if (isNaN(id)) {
    return null;
  }
  
  // Use automatic LCID to codepage mapping
  return getEncodingForLcid(id);
};

// Helper function to decode text with LANGID-based encoding detection
export async function decodeText(buffer: ArrayBuffer): Promise<string> {
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
    // Couldn't extract LANGID
  }
  
  // If we found a LANGID, use it to determine encoding
  if (langId) {
    const encoding = getEncodingByLangId(langId);
    if (!encoding) {
      throw new Error(`Unknown LANGID: ${langId}. Unable to determine proper encoding.`);
    }
    try {
      const decoder = new TextDecoder(encoding);
      return decoder.decode(buffer);
    } catch {
      throw new Error(`Failed to decode file with encoding ${encoding} for LANGID ${langId}`);
    }
  }
  
  // No LANGID found - this is an error for INI files
  throw new Error('No LANGID found in file. Cannot determine proper encoding.');
}

// Helper function to encode text with specified encoding
export function encodeTextWithEncoding(text: string, encoding: string): Uint8Array {
  
  try {
    // iconv.encode returns a Buffer, which is a subclass of Uint8Array in Node.js
    // In the browser environment with iconv-lite, it returns a Uint8Array-compatible object
    const encoded = iconv.encode(text, encoding);
    return new Uint8Array(encoded);
  } catch (error) {
    throw new Error(`Failed to encode text with ${encoding}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const englishText = await decodeText(await englishResponse.arrayBuffer());
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
    
    const text = await decodeText(await response.arrayBuffer());
    return parseIni(text);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Helper function to read local file content with LANGID-based encoding detection
export function readLocalFile(file: File): Promise<IniData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;

      decodeText(buffer).then(text => resolve(parseIni(text)));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

