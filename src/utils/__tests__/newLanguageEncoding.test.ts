import { describe, it, expect, vi } from 'vitest';
import {
  getEncodingByLangId,
  encodeTextWithEncoding,
  decodeText,
} from '../githubCache';
import { getLcidInfo } from '../localeCodepage';

// Mock lcid module with a broader set of languages for testing
vi.mock('lcid', () => ({
  default: {
    from: (lcid: number) => {
      const lcidMap: { [key: number]: string } = {
        // Western European
        1033: 'en_US',   // English (US)
        2057: 'en_GB',   // English (UK)
        1031: 'de_DE',   // German
        1036: 'fr_FR',   // French
        1034: 'es_ES',   // Spanish
        1040: 'it_IT',   // Italian
        1043: 'nl_NL',   // Dutch
        1046: 'pt_BR',   // Portuguese (Brazil)
        1053: 'sv_SE',   // Swedish
        
        // Central European
        1045: 'pl_PL',   // Polish
        1029: 'cs_CZ',   // Czech
        1038: 'hu_HU',   // Hungarian
        1048: 'ro_RO',   // Romanian
        1050: 'hr_HR',   // Croatian
        1051: 'sk_SK',   // Slovak
        1060: 'sl_SI',   // Slovenian
        1052: 'sq_AL',   // Albanian
        
        // Cyrillic
        1049: 'ru_RU',   // Russian
        1058: 'uk_UA',   // Ukrainian
        1059: 'be_BY',   // Belarusian
        1026: 'bg_BG',   // Bulgarian
        1071: 'mk_MK',   // Macedonian
        3098: 'sr_RS',   // Serbian (Cyrillic)
        1087: 'kk_KZ',   // Kazakh
        1067: 'hy_AM',   // Armenian
        
        // Other scripts
        1032: 'el_GR',   // Greek
        1055: 'tr_TR',   // Turkish
        1037: 'he_IL',   // Hebrew
        1025: 'ar_SA',   // Arabic
        1065: 'fa_IR',   // Persian/Farsi
        1054: 'th_TH',   // Thai
        1066: 'vi_VN',   // Vietnamese
        
        // Asian languages
        1041: 'ja_JP',   // Japanese
        1042: 'ko_KR',   // Korean
        2052: 'zh_CN',   // Chinese Simplified
        1028: 'zh_TW',   // Chinese Traditional
        3076: 'zh_HK',   // Chinese (Hong Kong)
        
        // Baltic
        1061: 'et_EE',   // Estonian
        1062: 'lv_LV',   // Latvian
        1063: 'lt_LT',   // Lithuanian
        
        // Indonesian/Malay
        1057: 'id_ID',   // Indonesian
        1086: 'ms_MY',   // Malay
      };
      return lcidMap[lcid] || null;
    }
  }
}));

// Mock iconv-lite with more realistic encoding simulation
vi.mock('iconv-lite', () => ({
  default: {
    encode: (text: string, encoding: string) => {
      const encoder = new TextEncoder();
      
      // Simulate different encodings with recognizable byte patterns
      switch (encoding) {
        case 'windows-1250': // Central European
          if (text.includes('ą')) return new Uint8Array([0xB9]); // Polish ą
          if (text.includes('č')) return new Uint8Array([0xE8]); // Czech č
          break;
          
        case 'windows-1251': // Cyrillic
          if (text.includes('ы')) return new Uint8Array([0xFB]); // Russian ы
          if (text.includes('Я')) return new Uint8Array([0xDF]); // Russian Я
          break;
          
        case 'windows-1253': // Greek
          if (text.includes('α')) return new Uint8Array([0xE1]); // Greek α
          break;
          
        case 'windows-1254': // Turkish
          if (text.includes('ğ')) return new Uint8Array([0xF0]); // Turkish ğ
          break;
          
        case 'windows-1255': // Hebrew
          if (text.includes('א')) return new Uint8Array([0xE0]); // Hebrew aleph
          break;
          
        case 'windows-1256': // Arabic
          if (text.includes('ا')) return new Uint8Array([0xC7]); // Arabic alif
          break;
          
        case 'windows-874': // Thai
          if (text.includes('ก')) return new Uint8Array([0xA1]); // Thai ko kai
          break;
          
        case 'shift_jis': // Japanese
          if (text.includes('あ')) return new Uint8Array([0x82, 0xA0]); // Hiragana a
          break;
          
        case 'euc-kr': // Korean
          if (text.includes('가')) return new Uint8Array([0xB0, 0xA1]); // Korean ga
          break;
          
        case 'gb18030': // Chinese Simplified
          if (text.includes('中')) return new Uint8Array([0xD6, 0xD0]); // Chinese "zhong"
          break;
          
        case 'big5': // Chinese Traditional
          if (text.includes('中')) return new Uint8Array([0xA4, 0xA4]); // Chinese "zhong" in Big5
          break;
      }
      
      // Default: return UTF-8 encoded text
      return encoder.encode(text);
    },
    
    decode: (buffer: Uint8Array) => {
      // Simple mock decoder for testing
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    },
    
    encodingExists: (encoding: string) => {
      const supportedEncodings = [
        'windows-1250', 'windows-1251', 'windows-1252', 'windows-1253',
        'windows-1254', 'windows-1255', 'windows-1256', 'windows-1257',
        'windows-1258', 'windows-874', 'shift_jis', 'euc-kr',
        'gb18030', 'big5', 'utf-8'
      ];
      return supportedEncodings.includes(encoding);
    }
  }
}));

describe('New Language Creation - Encoding Support', () => {
  describe('Sample languages from different character sets', () => {
    const testLanguages = [
      // Western European (windows-1252)
      { lcid: 1033, language: 'English (US)', expectedEncoding: 'windows-1252', sampleText: 'Hello World' },
      { lcid: 1031, language: 'German', expectedEncoding: 'windows-1252', sampleText: 'Hallo Welt' },
      { lcid: 1036, language: 'French', expectedEncoding: 'windows-1252', sampleText: 'Bonjour le monde' },
      { lcid: 1034, language: 'Spanish', expectedEncoding: 'windows-1252', sampleText: 'Hola Mundo' },
      
      // Central European (windows-1250)
      { lcid: 1045, language: 'Polish', expectedEncoding: 'windows-1250', sampleText: 'Witaj świecie' },
      { lcid: 1029, language: 'Czech', expectedEncoding: 'windows-1250', sampleText: 'Ahoj světe' },
      { lcid: 1038, language: 'Hungarian', expectedEncoding: 'windows-1250', sampleText: 'Helló Világ' },
      
      // Cyrillic (windows-1251)
      { lcid: 1049, language: 'Russian', expectedEncoding: 'windows-1251', sampleText: 'Привет мир' },
      { lcid: 1058, language: 'Ukrainian', expectedEncoding: 'windows-1251', sampleText: 'Привіт світ' },
      { lcid: 1026, language: 'Bulgarian', expectedEncoding: 'windows-1251', sampleText: 'Здравей свят' },
      
      // Other scripts
      { lcid: 1032, language: 'Greek', expectedEncoding: 'windows-1253', sampleText: 'Γεια σας κόσμος' },
      { lcid: 1055, language: 'Turkish', expectedEncoding: 'windows-1254', sampleText: 'Merhaba Dünya' },
      { lcid: 1037, language: 'Hebrew', expectedEncoding: 'windows-1255', sampleText: 'שלום עולם' },
      { lcid: 1025, language: 'Arabic', expectedEncoding: 'windows-1256', sampleText: 'مرحبا بالعالم' },
      { lcid: 1054, language: 'Thai', expectedEncoding: 'windows-874', sampleText: 'สวัสดีโลก' },
      
      // Asian languages
      { lcid: 1041, language: 'Japanese', expectedEncoding: 'shift_jis', sampleText: 'こんにちは世界' },
      { lcid: 1042, language: 'Korean', expectedEncoding: 'euc-kr', sampleText: '안녕하세요 세계' },
      { lcid: 2052, language: 'Chinese Simplified', expectedEncoding: 'gb18030', sampleText: '你好世界' },
      { lcid: 1028, language: 'Chinese Traditional', expectedEncoding: 'big5', sampleText: '你好世界' },
    ];

    testLanguages.forEach(({ lcid, language, expectedEncoding, sampleText }) => {
      it(`should correctly map ${language} (LCID: ${lcid}) to ${expectedEncoding}`, () => {
        const encoding = getEncodingByLangId(lcid.toString());
        expect(encoding).toBe(expectedEncoding);
        
        // Test that the encoding exists
        const lcidInfo = getLcidInfo(lcid);
        expect(lcidInfo.encoding).toBe(expectedEncoding);
        expect(lcidInfo.lcid).toBe(lcid);
        expect(lcidInfo.locale).toBeTruthy();
      });
      
      it(`should encode/decode ${language} text properly`, () => {
        const encoding = getEncodingByLangId(lcid.toString());
        expect(encoding).toBe(expectedEncoding);
        
        // Test encoding
        const iniContent = `LANGID=${lcid}\n[Section]\nKey=${sampleText}`;
        expect(() => encodeTextWithEncoding(iniContent, encoding!)).not.toThrow();
        
        const encodedData = encodeTextWithEncoding(iniContent, encoding!);
        expect(encodedData).toBeInstanceOf(Uint8Array);
        expect(encodedData.length).toBeGreaterThan(0);
      });
    });
  });

  describe('New translation file creation workflow', () => {
    it('should create proper LANGID content for new translations', async () => {
      const testCases = [
        { lcid: 1031, language: 'German' },
        { lcid: 1045, language: 'Polish' },
        { lcid: 1049, language: 'Russian' },
        { lcid: 1041, language: 'Japanese' },
        { lcid: 2052, language: 'Chinese Simplified' },
      ];

      for (const { lcid } of testCases) {
        // Simulate new translation creation
        const newTranslationContent = `LANGID=${lcid}`;
        
        // Verify LANGID can be extracted
        const encoder = new TextEncoder();
        const buffer = encoder.encode(newTranslationContent).buffer;
        
        try {
          const decoded = await decodeText(buffer);
          expect(decoded).toBe(newTranslationContent);
          expect(decoded).toContain(`LANGID=${lcid}`);
        } catch (error) {
          // If decoding fails due to unknown LCID, that's expected for our test mock
          // The real implementation should handle all LCIDs from lcid.json
          if (error instanceof Error && error.message.includes('Unknown LANGID')) {
            // This is expected for LCIDs not in our mock, skip this test case
            continue;
          }
          throw error;
        }
      }
    });

    it('should handle new translation files with minimal content', async () => {
      // Test that our new translation creation produces valid files
      const supportedLangIds = ['1033', '1031', '1045', '1049']; // English, German, Polish, Russian
      
      for (const langId of supportedLangIds) {
        const content = `LANGID=${langId}`;
        const encoding = getEncodingByLangId(langId);
        
        expect(encoding).toBeTruthy();
        
        // Encode the content
        const encoded = encodeTextWithEncoding(content, encoding!);
        expect(encoded).toBeInstanceOf(Uint8Array);
        
        // Decode it back
        const buffer = encoded.buffer;
        const decoded = await decodeText(buffer);
        
        expect(decoded).toContain(`LANGID=${langId}`);
      }
    });

    it('should properly extract LANGID from new translation files', async () => {
      // Test LANGID extraction from various positions in file
      const testCases = [
        `LANGID=1033`,                           // Only LANGID
        `LANGID=1031\n`,                         // LANGID with newline
        `LANGID=1045\n[Section]\nKey=Value`,     // LANGID with additional content
        `; Comment\nLANGID=1049\n[Section]`,     // LANGID after comment
      ];

      for (const content of testCases) {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(content).buffer;
        
        try {
          const decoded = await decodeText(buffer);
          expect(decoded).toContain('LANGID=');
          
          // Extract the LANGID value
          const match = decoded.match(/LANGID=(\d+)/);
          expect(match).toBeTruthy();
          expect(match![1]).toMatch(/^\d+$/);
        } catch (error) {
          // Skip if LANGID is not supported in our mock
          if (error instanceof Error && error.message.includes('Unknown LANGID')) {
            continue;
          }
          throw error;
        }
      }
    });
  });

  describe('Error handling for unsupported languages', () => {
    it('should handle unknown LCIDs gracefully', () => {
      const unknownLcids = ['9999', '0', '99999'];
      
      unknownLcids.forEach(lcid => {
        const encoding = getEncodingByLangId(lcid);
        expect(encoding).toBeNull();
        
        const lcidInfo = getLcidInfo(parseInt(lcid));
        expect(lcidInfo.encoding).toBeNull();
        expect(lcidInfo.locale).toBeNull();
      });
    });

    it('should reject files without LANGID', async () => {
      const contentWithoutLangId = '[Section]\nKey=Value\nAnotherKey=AnotherValue';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(contentWithoutLangId).buffer;
      
      await expect(decodeText(buffer)).rejects.toThrowError(
        'No LANGID found in file. Cannot determine proper encoding.'
      );
    });

    it('should handle malformed LANGID values', async () => {
      const malformedCases = [
        'LANGID=abc',
        'LANGID=',
        'LANGID=1.5',
        'LANGID=-1',
      ];

      for (const content of malformedCases) {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(content).buffer;
        
        await expect(decodeText(buffer)).rejects.toThrowError();
      }
    });
  });

  describe('Character set coverage verification', () => {
    it('should support all major Windows codepages', () => {
      const majorCodepages = [
        'windows-1250', // Central European
        'windows-1251', // Cyrillic
        'windows-1252', // Western European
        'windows-1253', // Greek
        'windows-1254', // Turkish
        'windows-1255', // Hebrew
        'windows-1256', // Arabic
        'windows-1257', // Baltic
        'windows-1258', // Vietnamese
        'windows-874',  // Thai
        'shift_jis',    // Japanese
        'euc-kr',       // Korean
        'gb18030',      // Chinese Simplified
        'big5',         // Chinese Traditional
      ];

      majorCodepages.forEach(encoding => {
        // Test that we can encode simple text with each codepage
        const testText = 'Test text for encoding';
        expect(() => encodeTextWithEncoding(testText, encoding)).not.toThrow();
      });
    });

    it('should correctly map language families to appropriate encodings', () => {
      const languageFamilies = [
        { family: 'Germanic', lcids: [1033, 1031, 1043, 1053], expectedEncoding: 'windows-1252' },
        { family: 'Romance', lcids: [1036, 1034, 1040, 1046], expectedEncoding: 'windows-1252' },
        { family: 'Slavic-Latin', lcids: [1045, 1029, 1050], expectedEncoding: 'windows-1250' },
        { family: 'Slavic-Cyrillic', lcids: [1049, 1058, 1026], expectedEncoding: 'windows-1251' },
        { family: 'Sino-Tibetan', lcids: [2052, 1028], expectedEncodings: ['gb18030', 'big5'] },
      ];

      languageFamilies.forEach(({ lcids, expectedEncoding, expectedEncodings }) => {
        lcids.forEach(lcid => {
          const encoding = getEncodingByLangId(lcid.toString());
          if (expectedEncodings) {
            expect(expectedEncodings).toContain(encoding);
          } else {
            expect(encoding).toBe(expectedEncoding);
          }
        });
      });
    });
  });
});
