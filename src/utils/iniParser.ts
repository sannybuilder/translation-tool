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
      currentSection = trimmedLine.slice(1, -1);
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

export function serializeIni(data: IniData): string {
  const lines: string[] = [];
  
  // Handle root-level entries (like LANGID) first
  const sections = Object.keys(data).sort((a, b) => {
    // Ensure empty section (root level) comes first
    if (a === '') return -1;
    if (b === '') return 1;
    return a.localeCompare(b);
  });
  
  for (const section of sections) {
    if (section === '') {
      // Handle root-level entries (typically LANGID)
      const keys = Object.keys(data[section]);
      for (const key of keys) {
        lines.push(`${key}=${data[section][key]}`);
      }
      if (keys.length > 0) {
        lines.push(''); // Add blank line after root entries
      }
    } else {
      // Handle regular sections
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

// Utility function to count format specifiers in a string
export function countFormatSpecifiers(text: string): { percentD: number; percentS: number } {
  const percentDMatches = text.match(/%d/g) || [];
  const percentSMatches = text.match(/%s/g) || [];
  
  return {
    percentD: percentDMatches.length,
    percentS: percentSMatches.length
  };
}
