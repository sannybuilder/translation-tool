import lcidLib from 'lcid';

// Windows locale to encoding mapping
// Supports both ANSI codepages and UTF-8 for languages that require it
// Based on official Windows locale/codepage assignments
// Reference: https://docs.microsoft.com/en-us/windows/win32/intl/code-page-identifiers
const LOCALE_TO_CODEPAGE: Record<string, string> = {
  // Western European (CP1252)
  'en': 'windows-1252',    // English (all variants)
  'de': 'windows-1252',    // German
  'fr': 'windows-1252',    // French
  'es': 'windows-1252',    // Spanish
  'it': 'windows-1252',    // Italian
  'pt': 'windows-1252',    // Portuguese
  'nl': 'windows-1252',    // Dutch
  'sv': 'windows-1252',    // Swedish
  'no': 'windows-1252',    // Norwegian
  'da': 'windows-1252',    // Danish
  'fi': 'windows-1252',    // Finnish
  'id': 'windows-1252',    // Indonesian
  'ms': 'windows-1252',    // Malay
  'sw': 'windows-1252',    // Swahili
  'af': 'windows-1252',    // Afrikaans
  'ca': 'windows-1252',    // Catalan
  'eu': 'windows-1252',    // Basque
  'gl': 'windows-1252',    // Galician
  'is': 'windows-1252',    // Icelandic
  'ga': 'windows-1252',    // Irish
  'lb': 'windows-1252',    // Luxembourgish
  'mt': 'windows-1252',    // Maltese
  
  // Central European (CP1250)
  'pl': 'windows-1250',    // Polish
  'cs': 'windows-1250',    // Czech
  'hu': 'windows-1250',    // Hungarian
  'ro': 'windows-1250',    // Romanian
  'hr': 'windows-1250',    // Croatian
  'sk': 'windows-1250',    // Slovak
  'sl': 'windows-1250',    // Slovenian
  'sq': 'windows-1250',    // Albanian
  'bs': 'windows-1250',    // Bosnian
  
  // Cyrillic (CP1251)
  'ru': 'windows-1251',    // Russian
  'uk': 'windows-1251',    // Ukrainian
  'be': 'windows-1251',    // Belarusian
  'bg': 'windows-1251',    // Bulgarian
  'mk': 'windows-1251',    // Macedonian
  'sr': 'windows-1251',    // Serbian (Cyrillic)
  'kk': 'windows-1251',    // Kazakh
  'ky': 'windows-1251',    // Kyrgyz
  'tg': 'windows-1251',    // Tajik
  'uz': 'windows-1251',    // Uzbek (Cyrillic)
  'az': 'windows-1251',    // Azerbaijani (Cyrillic)
  'hy': 'utf-8',           // Armenian (has its own script, requires UTF-8)
  
  // Greek (CP1253)
  'el': 'windows-1253',
  
  // Turkish (CP1254)
  'tr': 'windows-1254',
  
  // Hebrew (CP1255)
  'he': 'windows-1255',
  'iw': 'windows-1255',    // Hebrew (old code)
  
  // Arabic (CP1256)
  'ar': 'windows-1256',
  'fa': 'windows-1256',    // Persian/Farsi
  
  // Baltic (CP1257)
  'et': 'windows-1257',    // Estonian
  'lv': 'windows-1257',    // Latvian
  'lt': 'windows-1257',    // Lithuanian
  
  // Vietnamese (CP1258)
  'vi': 'windows-1258',
  
  // Thai (CP874)
  'th': 'windows-874',
  
  // Japanese (CP932 - Shift-JIS)
  'ja': 'shift_jis',
  
  // Korean (CP949)
  'ko': 'euc-kr',
  
  // Chinese Simplified (CP936 - GBK)
  'zh_CN': 'gb18030',
  'zh_Hans': 'gb18030',
  'zh_SG': 'gb18030',      // Singapore Chinese
  
  // Chinese Traditional (CP950 - Big5)
  'zh_TW': 'big5',
  'zh_Hant': 'big5',
  'zh_HK': 'big5',         // Hong Kong
  'zh_MO': 'big5',         // Macau
  
  // Indian Scripts (UTF-8 for proper script support)
  'hi': 'utf-8',           // Hindi (Devanagari script)
  'bn': 'utf-8',           // Bengali (Bengali script)
  'gu': 'utf-8',           // Gujarati (Gujarati script)
  'kn': 'utf-8',           // Kannada (Kannada script)
  'ml': 'utf-8',           // Malayalam (Malayalam script)
  'mr': 'utf-8',           // Marathi (Devanagari script)
  'ne': 'utf-8',           // Nepali (Devanagari script)
  'pa': 'utf-8',           // Punjabi (Gurmukhi script)
  'si': 'utf-8',           // Sinhala (Sinhala script)
  'ta': 'utf-8',           // Tamil (Tamil script)
  'te': 'utf-8',           // Telugu (Telugu script)
  'ur': 'utf-8',           // Urdu (Perso-Arabic script)
  
  // Other Important Languages
  'ka': 'utf-8',           // Georgian (has its own script, requires UTF-8)
  'am': 'windows-1252',    // Amharic (fallback to windows-1252)
  'my': 'windows-1252',    // Burmese (fallback to windows-1252)
  'km': 'windows-1252',    // Khmer (fallback to windows-1252)
  'lo': 'windows-1252',    // Lao (fallback to windows-1252)
  'mn': 'windows-1252',    // Mongolian (fallback to windows-1252)
};

/**
 * Get the encoding for a given LCID (Language Code ID)
 * @param lcid The Windows Language Code ID
 * @returns The encoding name compatible with iconv-lite, or null if not found
 */
export function getEncodingForLcid(lcid: number): string | null {
  try {
    // Use lcid package to convert LCID to locale string
    const locale = lcidLib.from(lcid);
    
    if (!locale) {
      console.warn(`Unknown LCID: ${lcid}`);
      return null;
    }
    
    // Try full locale match (e.g., 'zh_CN')
    let encoding = LOCALE_TO_CODEPAGE[locale];
    
    if (!encoding) {
      // Try language part only (e.g., 'zh' from 'zh_CN')
      const language = locale.split('_')[0];
      encoding = LOCALE_TO_CODEPAGE[language];
    }
    
    if (!encoding) {
      // Special handling for Chinese variants
      if (locale.includes('zh')) {
        // Default to Simplified Chinese for unknown Chinese variants
        encoding = locale.includes('TW') || locale.includes('HK') || locale.includes('MO') 
          ? 'big5' 
          : 'gb18030';
      }
    }
    
    if (!encoding) {
      console.warn(`No codepage mapping found for locale: ${locale} (LCID: ${lcid})`);
      return null;
    }
    
    return encoding;
  } catch (error) {
    console.error(`Error processing LCID ${lcid}:`, error);
    return null;
  }
}

/**
 * Get locale information for an LCID
 * @param lcid The Windows Language Code ID
 * @returns Object with locale and encoding information
 */
export function getLcidInfo(lcid: number): { lcid: number; locale: string | null; encoding: string | null } {
  const locale = lcidLib.from(lcid);
  const encoding = getEncodingForLcid(lcid);
  
  return {
    lcid,
    locale: locale || null,
    encoding
  };
}

// Export a function to test if an encoding is supported
export function isEncodingSupported(encoding: string): boolean {
  // This should match what iconv-lite supports
  const supportedEncodings = new Set([
    'windows-1250', 'windows-1251', 'windows-1252', 'windows-1253',
    'windows-1254', 'windows-1255', 'windows-1256', 'windows-1257',
    'windows-1258', 'windows-874', 'shift_jis', 'euc-kr',
    'gb18030', 'big5', 'utf-8', 'utf-16', 'utf-16le', 'utf-16be'
  ]);
  
  return supportedEncodings.has(encoding);
}
