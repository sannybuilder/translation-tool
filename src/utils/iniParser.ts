export interface IniSection {
  [key: string]: string;
}

export interface IniData {
  [section: string]: IniSection;
}

export function parseIni(content: string): IniData {
  const lines = content.split('\n');
  const result: IniData = {};
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
      continue;
    }

    // Check for section header
    if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      currentSection = trimmedLine.slice(1, -1).trim();
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      continue;
    }

    // Parse key-value pairs
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Handle LANGID or other root-level entries
      if (!currentSection) {
        if (!result['']) {
          result[''] = {};
        }
        result[''][key] = value;
      } else {
        result[currentSection][key] = value;
      }
    }
  }

  return result;
}

export function serializeIni(data: IniData, baseOrder?: IniData): string {
  // If no base order is provided, fall back to alphabetical output for stability
  if (!baseOrder) {
    const lines: string[] = [];
    const sections = Object.keys(data).sort((a, b) => {
      if (a === '') return -1;
      if (b === '') return 1;
      return a.localeCompare(b);
    });
    for (const section of sections) {
      if (section === '') {
        const keys = Object.keys(data[section]);
        for (const key of keys) {
          lines.push(`${key}=${data[section][key]}`);
        }
        if (keys.length > 0) lines.push('');
      } else {
        lines.push(`[${section}]`);
        const keys = Object.keys(data[section]).sort();
        for (const key of keys) {
          lines.push(`${key}=${data[section][key]}`);
        }
        lines.push('');
      }
    }
    return lines.join('\n');
  }

  // Preserve the exact section and key order from the base (English) file.
  const lines: string[] = [];

  const baseSections = Object.keys(baseOrder);

  // 1) Root-level entries in base order, then any extra root keys
  const hasBaseRoot = baseSections.includes('');
  const baseRootKeys = hasBaseRoot ? Object.keys(baseOrder['']) : [];
  if (hasBaseRoot) {
    for (const key of baseRootKeys) {
      const value = (data[''] && key in data['']) ? data[''][key] : '';
      lines.push(`${key}=${value}`);
    }
  }
  if (baseRootKeys.length > 0) lines.push('');

  // Extra root keys (in data but not in base), placed after base root keys
  const baseRootKeySet = new Set(baseRootKeys);
  const extraRootKeys = data[''] ? Object.keys(data['']).filter(k => !baseRootKeySet.has(k)) : [];
  for (const key of extraRootKeys) {
    lines.push(`${key}=${data[''][key]}`);
  }
  if (extraRootKeys.length > 0) lines.push('');

  // 2) Sectioned entries in base order
  for (const section of baseSections) {
    if (section === '') continue;
    lines.push(`[${section}]`);
    const baseKeys = Object.keys(baseOrder[section] || {});
    for (const key of baseKeys) {
      const value = (data[section] && key in data[section]) ? data[section][key] : '';
      lines.push(`${key}=${value}`);
    }
    lines.push('');
  }

  // 3) Append any extra sections that exist in data but not in baseOrder
  const baseSectionSet = new Set(baseSections);
  const extraSections = Object.keys(data).filter(s => !baseSectionSet.has(s));
  for (const section of extraSections) {
    if (section === '') continue;
    lines.push(`[${section}]`);
    const keys = Object.keys(data[section] || {});
    for (const key of keys) {
      lines.push(`${key}=${data[section][key]}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Utility function to count format specifiers in a string
export function countFormatSpecifiers(text: string): { percentD: number; percentS: number; newLines: number } {
  const percentDMatches = text.match(/%d/g) || [];
  const percentSMatches = text.match(/%s/g) || [];
  const newLineMatches = text.match(/\\n/g) || [];
  
  return {
    percentD: percentDMatches.length,
    percentS: percentSMatches.length,
    newLines: newLineMatches.length
  };
}
