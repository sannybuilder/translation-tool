import { describe, it, expect } from 'vitest';
import { getEncodingForLcid, getLcidInfo, isEncodingSupported } from '../localeCodepage';

describe('Locale Codepage Mapping', () => {
  describe('getEncodingForLcid', () => {
    it('should return correct encoding for English LCIDs', () => {
      expect(getEncodingForLcid(1033)).toBe('windows-1252'); // en_US
      expect(getEncodingForLcid(2057)).toBe('windows-1252'); // en_GB
      expect(getEncodingForLcid(3081)).toBe('windows-1252'); // en_AU
      expect(getEncodingForLcid(4105)).toBe('windows-1252'); // en_CA
    });

    it('should return correct encoding for European languages', () => {
      expect(getEncodingForLcid(1031)).toBe('windows-1252'); // de_DE
      expect(getEncodingForLcid(1036)).toBe('windows-1252'); // fr_FR
      expect(getEncodingForLcid(1040)).toBe('windows-1252'); // it_IT
      expect(getEncodingForLcid(1034)).toBe('windows-1252'); // es_ES
    });

    it('should return correct encoding for Central European languages', () => {
      expect(getEncodingForLcid(1045)).toBe('windows-1250'); // pl_PL
      expect(getEncodingForLcid(1029)).toBe('windows-1250'); // cs_CZ
      expect(getEncodingForLcid(1038)).toBe('windows-1250'); // hu_HU
      expect(getEncodingForLcid(1048)).toBe('windows-1250'); // ro_RO
      expect(getEncodingForLcid(1050)).toBe('windows-1250'); // hr_HR
    });

    it('should return correct encoding for Cyrillic languages', () => {
      expect(getEncodingForLcid(1049)).toBe('windows-1251'); // ru_RU
      expect(getEncodingForLcid(1058)).toBe('windows-1251'); // uk_UA
      expect(getEncodingForLcid(1059)).toBe('windows-1251'); // be_BY
      expect(getEncodingForLcid(1026)).toBe('windows-1251'); // bg_BG
      expect(getEncodingForLcid(1067)).toBe('windows-1251'); // hy_AM (Armenian)
    });

    it('should return correct encoding for Asian languages', () => {
      expect(getEncodingForLcid(1041)).toBe('shift_jis');   // ja_JP
      expect(getEncodingForLcid(1042)).toBe('euc-kr');      // ko_KR
      expect(getEncodingForLcid(2052)).toBe('gb18030');     // zh_CN
      expect(getEncodingForLcid(1028)).toBe('big5');        // zh_TW
      expect(getEncodingForLcid(3076)).toBe('big5');        // zh_HK
      expect(getEncodingForLcid(1054)).toBe('windows-874'); // th_TH
    });

    it('should return correct encoding for other languages', () => {
      expect(getEncodingForLcid(1032)).toBe('windows-1253'); // el_GR (Greek)
      expect(getEncodingForLcid(1055)).toBe('windows-1254'); // tr_TR (Turkish)
      expect(getEncodingForLcid(1037)).toBe('windows-1255'); // he_IL (Hebrew)
      expect(getEncodingForLcid(1025)).toBe('windows-1256'); // ar_SA (Arabic)
      expect(getEncodingForLcid(1061)).toBe('windows-1257'); // et_EE (Estonian)
      expect(getEncodingForLcid(1066)).toBe('windows-1258'); // vi_VN (Vietnamese)
    });

    it('should return correct encoding for Indonesian', () => {
      expect(getEncodingForLcid(1057)).toBe('windows-1252'); // id_ID
    });

    it('should handle unknown LCIDs gracefully', () => {
      expect(getEncodingForLcid(9999)).toBeNull();
      expect(getEncodingForLcid(0)).toBeNull();
    });

    it('should handle regional variants correctly', () => {
      // All German variants should use windows-1252
      expect(getEncodingForLcid(1031)).toBe('windows-1252'); // de_DE
      expect(getEncodingForLcid(2055)).toBe('windows-1252'); // de_CH
      expect(getEncodingForLcid(3079)).toBe('windows-1252'); // de_AT
      
      // All Russian variants should use windows-1251
      expect(getEncodingForLcid(1049)).toBe('windows-1251'); // ru_RU
      expect(getEncodingForLcid(2073)).toBe('windows-1251'); // ru_MD (Moldova)
    });
  });

  describe('getLcidInfo', () => {
    it('should return complete info for valid LCIDs', () => {
      const info = getLcidInfo(1033);
      expect(info).toEqual({
        lcid: 1033,
        locale: 'en_US',
        encoding: 'windows-1252'
      });
    });

    it('should return partial info for unknown LCIDs', () => {
      const info = getLcidInfo(9999);
      expect(info).toEqual({
        lcid: 9999,
        locale: null,
        encoding: null
      });
    });
  });

  describe('isEncodingSupported', () => {
    it('should return true for supported encodings', () => {
      expect(isEncodingSupported('windows-1252')).toBe(true);
      expect(isEncodingSupported('windows-1250')).toBe(true);
      expect(isEncodingSupported('windows-1251')).toBe(true);
      expect(isEncodingSupported('shift_jis')).toBe(true);
      expect(isEncodingSupported('euc-kr')).toBe(true);
      expect(isEncodingSupported('gb18030')).toBe(true);
      expect(isEncodingSupported('big5')).toBe(true);
    });

    it('should return false for unsupported encodings', () => {
      expect(isEncodingSupported('invalid-encoding')).toBe(false);
      expect(isEncodingSupported('iso-8859-1')).toBe(false);
      expect(isEncodingSupported('')).toBe(false);
    });
  });
});
