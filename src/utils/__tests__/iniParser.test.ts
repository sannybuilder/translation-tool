import { describe, it, expect } from 'vitest';
import { serializeIni, parseIni, countFormatSpecifiers, type IniData } from '../iniParser';

describe('serializeIni ordering', () => {
  it('preserves base (English) section and key order, filling missing with empty and appending extras', () => {
    const baseOrder: IniData = {
      '': { LANGID: '1033', VERSION: '1.0' },
      General: { Hello: '', Bye: '' },
      UI: { Ok: '', Cancel: '' },
    };

    const translation: IniData = {
      '': { LANGID: '1033', VERSION: '2.0', EXTRA: 'X' },
      General: { Bye: 'Ciao', Hello: 'Hallo' },
      UI: { Cancel: 'Abbrechen' },
    };

    const output = serializeIni(translation, baseOrder);
    const expected = [
      'LANGID=1033',
      'VERSION=2.0',
      '',
      'EXTRA=X',
      '',
      '[General]',
      'Hello=Hallo',
      'Bye=Ciao',
      '',
      '[UI]',
      'Ok=', // missing in translation -> empty
      'Cancel=Abbrechen',
      '',
    ].join('\n');

    expect(output).toBe(expected);
  });

  it('falls back to alphabetical ordering without baseOrder', () => {
    const data: IniData = {
      '': { ZED: '1', A: '2' },
      B: { bKey2: 'y', aKey1: 'x' },
      A: { zKey: '3', aKey: '4' },
    };

    const output = serializeIni(data);
    const expected = [
      'ZED=1',
      'A=2',
      '',
      '[A]',
      'aKey=4',
      'zKey=3',
      '',
      '[B]',
      'aKey1=x',
      'bKey2=y',
      '',
    ].join('\n');

    expect(output).toBe(expected);
  });
});

describe('parseIni', () => {
  it('parses sections, root-level entries, comments, and trims whitespace', () => {
    const ini = [
      '; comment line',
      '# another comment',
      '  LANGID = 1033  ',
      'VERSION= 1.2 ',
      '',
      '[ General ]',
      ' Hello = World ',
      'Bye=Now',
      '',
      '[UI]',
      'Ok=OK',
      'Cancel=Cancel',
      '',
      'not-a-pair-without-equals',
    ].join('\n');

    const parsed = parseIni(ini);
    expect(parsed['']).toBeDefined();
    expect(parsed[''].LANGID).toBe('1033');
    expect(parsed[''].VERSION).toBe('1.2');

    expect(parsed['General']).toBeDefined();
    expect(parsed['General'].Hello).toBe('World');
    expect(parsed['General'].Bye).toBe('Now');

    expect(parsed['UI'].Ok).toBe('OK');
    expect(parsed['UI'].Cancel).toBe('Cancel');

    // Non key=value lines are ignored
    expect(Object.prototype.hasOwnProperty.call(parsed, 'not-a-pair-without-equals')).toBe(false);
  });

  it('round-trips with serializeIni (alphabetical fallback)', () => {
    const data: IniData = {
      '': { LANGID: '1033', VERSION: '1.0' },
      B: { b: '2', a: '1' },
      A: { z: '9', a: '0' },
    };
    const serialized = serializeIni(data);
    const reparsed = parseIni(serialized);
    expect(reparsed).toEqual({
      '': { LANGID: '1033', VERSION: '1.0' },
      A: { a: '0', z: '9' },
      B: { a: '1', b: '2' },
    });
  });
});

describe('serializeIni with extra sections vs base', () => {
  it('appends sections not present in base after all base sections', () => {
    const base: IniData = {
      '': { LANGID: '1033' },
      BaseOnly: { A: '' },
    };
    const data: IniData = {
      '': { LANGID: '1033' },
      BaseOnly: { A: 'x' },
      Extra: { K1: 'v1', K2: 'v2' },
    };
    const output = serializeIni(data, base);
    const expected = [
      'LANGID=1033',
      '',
      '[BaseOnly]',
      'A=x',
      '',
      '[Extra]',
      'K1=v1',
      'K2=v2',
      '',
    ].join('\n');
    expect(output).toBe(expected);
  });
});

describe('countFormatSpecifiers', () => {
  it('counts %d, %s, and literal \\n sequences', () => {
    const text = 'Hello %s, you have %d items.\\nNext line with %s and %d.\\n';
    const counts = countFormatSpecifiers(text);
    expect(counts.percentS).toBe(2);
    expect(counts.percentD).toBe(2);
    expect(counts.newLines).toBe(2);
  });

  it('returns zeros when none are present', () => {
    const counts = countFormatSpecifiers('No specifiers here.');
    expect(counts).toEqual({ percentD: 0, percentS: 0, newLines: 0 });
  });
});


