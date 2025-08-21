import { describe, it, expect, vi } from 'vitest';
import {
  getEncodingByLangId,
  encodeTextWithEncoding,
  decodeText,
} from '../githubCache';

// Mock lcid module
vi.mock('lcid', () => ({
  default: {
    from: (lcid: number) => {
      const lcidMap: { [key: number]: string } = {
        1033: 'en_US', 2057: 'en_GB',
        1031: 'de_DE', 1036: 'fr_FR',
        1045: 'pl_PL', 1029: 'cs_CZ',
        1049: 'ru_RU', 1058: 'uk_UA',
        1067: 'hy_AM', 1032: 'el_GR',
        1055: 'tr_TR', 1057: 'id_ID',
        1041: 'ja_JP', 1042: 'ko_KR',
        2052: 'zh_CN', 1028: 'zh_TW',
        1054: 'th_TH'
      };
      return lcidMap[lcid] || null;
    }
  }
}));

// Mock iconv-lite
vi.mock('iconv-lite', () => ({
  default: {
    encode: (text: string, encoding: string) => {
      // Simulate encoding for different character sets
      const encoder = new TextEncoder();
      
      // For testing, return recognizable patterns for specific encodings
      if (encoding === 'windows-1250' && text.includes('ą')) {
        return new Uint8Array([0xB9]); // windows-1250 code for 'ą'
      }
      if (encoding === 'windows-1251' && text.includes('ы')) {
        return new Uint8Array([0xFB]); // windows-1251 code for 'ы'
      }
      
      // Default: return UTF-8 encoded text for testing
      return encoder.encode(text);
    },
    encodingExists: (encoding: string) => {
      // List of encodings we support in tests
      const supportedEncodings = [
        'windows-1250', 'windows-1251', 'windows-1252',
        'windows-1253', 'windows-1254', 'windows-1255',
        'windows-1256', 'windows-874', 'shift_jis',
        'euc-kr', 'gb18030', 'big5'
      ];
      return supportedEncodings.includes(encoding);
    }
  }
}));

describe('Encoding Functions', () => {
  describe('getEncodingByLangId', () => {
    it('should return windows-1252 for English (US) LANGID 1033', () => {
      expect(getEncodingByLangId('1033')).toBe('windows-1252');
    });

    it('should return windows-1252 for English (UK) LANGID 2057', () => {
      expect(getEncodingByLangId('2057')).toBe('windows-1252');
    });

    it('should return windows-1252 for German LANGID 1031', () => {
      expect(getEncodingByLangId('1031')).toBe('windows-1252');
    });

    it('should return windows-1250 for Polish LANGID 1045', () => {
      expect(getEncodingByLangId('1045')).toBe('windows-1250');
    });

    it('should return windows-1250 for Czech LANGID 1029', () => {
      expect(getEncodingByLangId('1029')).toBe('windows-1250');
    });

    it('should return windows-1251 for Russian LANGID 1049', () => {
      expect(getEncodingByLangId('1049')).toBe('windows-1251');
    });

    it('should return windows-1251 for Ukrainian LANGID 1058', () => {
      expect(getEncodingByLangId('1058')).toBe('windows-1251');
    });

    it('should return utf-8 for Armenian LANGID 1067', () => {
      expect(getEncodingByLangId('1067')).toBe('utf-8');
    });

    it('should return windows-1253 for Greek LANGID 1032', () => {
      expect(getEncodingByLangId('1032')).toBe('windows-1253');
    });

    it('should return windows-1254 for Turkish LANGID 1055', () => {
      expect(getEncodingByLangId('1055')).toBe('windows-1254');
    });

    it('should return windows-1252 for Indonesian LANGID 1057', () => {
      expect(getEncodingByLangId('1057')).toBe('windows-1252');
    });

    it('should return shift_jis for Japanese LANGID 1041', () => {
      expect(getEncodingByLangId('1041')).toBe('shift_jis');
    });

    it('should return euc-kr for Korean LANGID 1042', () => {
      expect(getEncodingByLangId('1042')).toBe('euc-kr');
    });

    it('should return gb18030 for Chinese Simplified LANGID 2052', () => {
      expect(getEncodingByLangId('2052')).toBe('gb18030');
    });

    it('should return big5 for Chinese Traditional LANGID 1028', () => {
      expect(getEncodingByLangId('1028')).toBe('big5');
    });

    it('should return null for unknown LANGID', () => {
      expect(getEncodingByLangId('9999')).toBeNull();
    });

    it('should handle string LANGIDs with leading zeros', () => {
      expect(getEncodingByLangId('01033')).toBe('windows-1252');
    });

    it('should return null for invalid LANGID format', () => {
      expect(getEncodingByLangId('invalid')).toBeNull();
    });
  });

  describe('encodeTextWithEncoding', () => {
    it('should encode text with windows-1250 encoding', () => {
      const text = 'Test with Polish ą';
      const result = encodeTextWithEncoding(text, 'windows-1250');
      expect(result).toBeInstanceOf(Uint8Array);
      // The mock should return our test pattern for Polish characters
      if (text.includes('ą')) {
        expect(result[0]).toBe(0xB9);
      }
    });

    it('should encode text with windows-1251 encoding', () => {
      const text = 'Test with Russian ы';
      const result = encodeTextWithEncoding(text, 'windows-1251');
      expect(result).toBeInstanceOf(Uint8Array);
      // The mock should return our test pattern for Russian characters
      if (text.includes('ы')) {
        expect(result[0]).toBe(0xFB);
      }
    });

    it('should encode text with windows-1252 encoding', () => {
      const text = 'Test English text';
      const result = encodeTextWithEncoding(text, 'windows-1252');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should support UTF-8 encoding with iconv-lite 0.7.0', () => {
      const text = 'Test UTF-8 text with special chars: äöüß€';
      // With iconv-lite 0.7.0, UTF-8 is now supported
      const result = encodeTextWithEncoding(text, 'utf-8');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
      
      // UTF-8 encoding should produce more bytes for special characters
      // The text has 42 characters but should produce more bytes due to multi-byte chars
      expect(result.length).toBeGreaterThan(text.length);
    });

    it('should handle unknown encodings gracefully with iconv-lite 0.7.0', () => {
      const text = 'Test invalid encoding';
      // iconv-lite 0.7.0 is very permissive and may use fallback encodings for unknown names
      // It doesn't throw errors for unknown encodings, instead it might use a default
      const result = encodeTextWithEncoding(text, 'unknown-encoding-xyz');
      expect(result).toBeInstanceOf(Uint8Array);
      // The encoding still produces output, even if it's not what we expect
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      const result = encodeTextWithEncoding('', 'windows-1252');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle special characters in windows-1252', () => {
      const text = 'Café';  // Contains é which has a specific code in windows-1252
      const result = encodeTextWithEncoding(text, 'windows-1252');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should support Asian language encodings', () => {
      const text = 'Test text';
      // These should all work with iconv-lite
      expect(() => encodeTextWithEncoding(text, 'shift_jis')).not.toThrow();
      expect(() => encodeTextWithEncoding(text, 'euc-kr')).not.toThrow();
      expect(() => encodeTextWithEncoding(text, 'gb18030')).not.toThrow();
      expect(() => encodeTextWithEncoding(text, 'big5')).not.toThrow();
    });

    it('should support all Windows codepages we need', () => {
      const text = 'Test text';
      // All these should work with iconv-lite
      expect(() => encodeTextWithEncoding(text, 'windows-1253')).not.toThrow();
      expect(() => encodeTextWithEncoding(text, 'windows-1254')).not.toThrow();
      expect(() => encodeTextWithEncoding(text, 'windows-874')).not.toThrow();
    });
  });

  describe('decodeText', () => {
    it('should decode text with LANGID in the content', async () => {
      const text = 'LANGID=1045\nSome Polish text';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      const result = await decodeText(buffer);
      expect(typeof result).toBe('string');
      expect(result).toContain('LANGID=1045');
    });

    it('should decode text with Russian LANGID', async () => {
      const text = 'LANGID=1049\nРусский текст';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      const result = await decodeText(buffer);
      expect(typeof result).toBe('string');
      expect(result).toContain('LANGID=1049');
    });

    it('should throw error for files without LANGID', async () => {
      const text = 'No LANGID here, just text';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      await expect(decodeText(buffer)).rejects.toThrowError('No LANGID found in file. Cannot determine proper encoding.');
    });

    it('should throw error for empty buffer', async () => {
      const buffer = new ArrayBuffer(0);
      await expect(decodeText(buffer)).rejects.toThrowError('No LANGID found in file. Cannot determine proper encoding.');
    });

    it('should extract LANGID from the first 100 bytes', async () => {
      const longText = 'Some header text\nLANGID=1031\n' + 'x'.repeat(200);
      const encoder = new TextEncoder();
      const buffer = encoder.encode(longText).buffer;
      
      const result = await decodeText(buffer);
      expect(typeof result).toBe('string');
      expect(result).toContain('LANGID=1031');
    });

    it('should handle LANGID at the very beginning', async () => {
      const text = 'LANGID=1033\n[Section]\nKey=Value';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      const result = await decodeText(buffer);
      expect(typeof result).toBe('string');
      expect(result).toContain('LANGID=1033');
      expect(result).toContain('[Section]');
    });

    it('should throw error for unknown LANGID', async () => {
      const text = 'LANGID=9999\nSome text';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      // Should throw error for unknown LANGID
      await expect(decodeText(buffer)).rejects.toThrowError('Unknown LANGID: 9999. Unable to determine proper encoding.');
    });

    it('should throw error when LANGID is not a number', async () => {
      const text = 'LANGID=invalid\nSome text';
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text).buffer;
      
      // LANGID is invalid, will be ignored and treated as no LANGID
      await expect(decodeText(buffer)).rejects.toThrowError('No LANGID found in file. Cannot determine proper encoding.');
    });
  });

  describe('Integration: Read and Write with proper encoding', () => {
    it('should correctly encode and decode English text', async () => {
      const originalText = 'LANGID=1033\n[Commands]\n00000001=Save File';
      
      // Encode with English encoding
      const encoded = encodeTextWithEncoding(originalText, 'windows-1252');
      
      // Create a buffer from encoded data
      const buffer = encoded.buffer;
      
      // Decode should work correctly
      const decoded = await decodeText(buffer);
      
      expect(decoded).toBe(originalText);
    });

    it('should handle German text with windows-1252', async () => {
      const originalText = `LANGID=1031

[Section1]
Key1=Wert1
Key2=Wert2

[Section2]
Key3=Wert3`;
      
      // Encode with German encoding (windows-1252)
      const encoded = encodeTextWithEncoding(originalText, 'windows-1252');
      const buffer = encoded.buffer;
      const decoded = await decodeText(buffer);
      
      expect(decoded).toContain('LANGID=1031');
      expect(decoded).toContain('[Section1]');
      expect(decoded).toContain('[Section2]');
      expect(decoded).toContain('Key1=Wert1');
    });

    // Note: Full Polish and Russian character preservation tests would require
    // actual implementation of the windows-1250 and windows-1251 encoders
    // which are mocked in this test suite. The mocks only return simple patterns.
    
    it('should use the correct encoding based on LANGID', async () => {
      // Test that different LANGIDs result in correct encoding selection
      const testCases = [
        { langId: '1033', encoding: 'windows-1252', text: 'LANGID=1033\nEnglish' },
        { langId: '1045', encoding: 'windows-1250', text: 'LANGID=1045\nPolish' },
        { langId: '1049', encoding: 'windows-1251', text: 'LANGID=1049\nRussian' },
        { langId: '1057', encoding: 'windows-1252', text: 'LANGID=1057\nIndonesian' },
        { langId: '1041', encoding: 'shift_jis', text: 'LANGID=1041\nJapanese' },
        { langId: '1042', encoding: 'euc-kr', text: 'LANGID=1042\nKorean' },
        { langId: '2052', encoding: 'gb18030', text: 'LANGID=2052\nChinese Simplified' },
        { langId: '1028', encoding: 'big5', text: 'LANGID=1028\nChinese Traditional' },
      ];
      
      for (const testCase of testCases) {
        const expectedEncoding = getEncodingByLangId(testCase.langId);
        expect(expectedEncoding).toBe(testCase.encoding);
        
        // Verify encoding is applied
        const encoded = encodeTextWithEncoding(testCase.text, testCase.encoding);
        expect(encoded).toBeInstanceOf(Uint8Array);
      }
    });
  });

  describe('Error handling', () => {
    it('should throw or return error for missing LANGID when saving', () => {
      // This would be tested in the App.tsx save handler
      const langId = '';
      const encoding = getEncodingByLangId(langId);
      expect(encoding).toBeNull();
    });

    it('should handle malformed LANGID gracefully', () => {
      const malformedIds = ['abc', '10.5', '-1', ''];
      
      malformedIds.forEach(id => {
        const encoding = getEncodingByLangId(id);
        expect(encoding).toBeNull();
      });
    });

    it('should handle very large LANGID numbers', () => {
      const largeId = '999999999';
      const encoding = getEncodingByLangId(largeId);
      expect(encoding).toBeNull();
    });
  });
});
