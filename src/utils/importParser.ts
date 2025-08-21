export interface ParsedChange {
  section: string;
  key: string;
  value: string;
}

export interface ParseResult {
  changes: ParsedChange[];
  format: 'ini' | 'diff' | 'github' | 'unknown';
  errors: string[];
}

/**
 * Parse imported translation data from various formats
 * Supports:
 * - INI format (plain INI snippet)
 * - Git diff/patch format
 * - GitHub issue format (with code blocks)
 */
export function parseImportedData(input: string): ParseResult {
  const trimmed = input.trim();
  const errors: string[] = [];
  const changes: ParsedChange[] = [];

  // Try to detect format
  let format: ParseResult['format'] = 'unknown';

  // Check for GitHub issue format (contains code blocks)
  if (trimmed.includes('```ini') || trimmed.includes('```diff')) {
    format = 'github';
    const codeBlockMatch = trimmed.match(/```(?:ini|diff)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const codeContent = codeBlockMatch[1];
      // Parse the content inside the code block
      const innerResult = parseRawContent(codeContent);
      changes.push(...innerResult.changes);
      errors.push(...innerResult.errors);
    } else {
      errors.push('Could not find code block in GitHub format');
    }
  }
  // Check for diff/patch format
  else if (trimmed.includes('@@') || trimmed.includes('---') || trimmed.includes('+++')) {
    format = 'diff';
    const diffResult = parseDiffFormat(trimmed);
    changes.push(...diffResult.changes);
    errors.push(...diffResult.errors);
  }
  // Otherwise, try to parse as INI format
  else {
    format = 'ini';
    const iniResult = parseIniFormat(trimmed);
    changes.push(...iniResult.changes);
    errors.push(...iniResult.errors);
  }

  return { changes, format, errors };
}

function parseRawContent(content: string): Pick<ParseResult, 'changes' | 'errors'> {
  // First try as diff format
  if (content.includes('@@') || content.includes('+') || content.includes('-')) {
    return parseDiffFormat(content);
  }
  // Otherwise parse as INI
  return parseIniFormat(content);
}

function parseDiffFormat(content: string): Pick<ParseResult, 'changes' | 'errors'> {
  const changes: ParsedChange[] = [];
  const errors: string[] = [];
  const lines = content.split('\n');
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('+++')) {
      continue;
    }
    
    // Handle section headers in diff format
    if (trimmed.includes('[') && trimmed.includes(']')) {
      const sectionMatch = trimmed.match(/\[([^\]]+)\]/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
      }
      continue;
    }
    
    // Handle @@ markers
    if (trimmed.startsWith('@@')) {
      // Extract key from @@ line if present
      const keyMatch = trimmed.match(/@@ ([^@]+) @@/);
      if (keyMatch) {
        // Sometimes the key is in the @@ line
        continue;
      }
    }
    
    // Handle added lines (new or modified values)
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.substring(1).trim();
      const equalIndex = content.indexOf('=');
      
      if (equalIndex > 0) {
        const key = content.substring(0, equalIndex).trim();
        const value = content.substring(equalIndex + 1).trim();
        
        if (currentSection && key && value) {
          changes.push({ section: currentSection, key, value });
        } else if (!currentSection) {
          errors.push(`No section found for key: ${key}`);
        }
      }
    }
  }
  
  return { changes, errors };
}

function parseIniFormat(content: string): Pick<ParseResult, 'changes' | 'errors'> {
  const changes: ParsedChange[] = [];
  const errors: string[] = [];
  const lines = content.split('\n');
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }
    
    // Check for section header
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1).trim();
      continue;
    }
    
    // Parse key-value pairs
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      
      if (currentSection) {
        changes.push({ section: currentSection, key, value });
      } else {
        // For root-level entries, use empty string as section
        changes.push({ section: '', key, value });
      }
    } else if (trimmed) {
      errors.push(`Invalid line format: ${trimmed}`);
    }
  }
  
  return { changes, errors };
}

/**
 * Format an import report for display to the user
 */
export function formatImportReport(
  imported: Array<{ section: string; key: string; value: string }>,
  skipped: Array<{ section: string; key: string; value: string; reason: string }>,
  replaced: Array<{ section: string; key: string; oldValue: string; newValue: string }>
): string {
  const lines: string[] = [];
  
  if (imported.length > 0) {
    lines.push(`✅ Successfully imported ${imported.length} change${imported.length !== 1 ? 's' : ''}:`);
    const sections = new Set(imported.map(c => c.section));
    lines.push(`   Sections affected: ${Array.from(sections).join(', ')}`);
  }
  
  if (replaced.length > 0) {
    lines.push('');
    lines.push(`🔄 Replaced ${replaced.length} existing change${replaced.length !== 1 ? 's' : ''}:`);
    for (const r of replaced.slice(0, 5)) {
      lines.push(`   [${r.section}] ${r.key}: "${r.oldValue}" → "${r.newValue}"`);
    }
    if (replaced.length > 5) {
      lines.push(`   ... and ${replaced.length - 5} more`);
    }
  }
  
  if (skipped.length > 0) {
    lines.push('');
    lines.push(`⚠️ Skipped ${skipped.length} item${skipped.length !== 1 ? 's' : ''}:`);
    const byReason = new Map<string, number>();
    for (const s of skipped) {
      byReason.set(s.reason, (byReason.get(s.reason) || 0) + 1);
    }
    for (const [reason, count] of byReason) {
      lines.push(`   ${reason}: ${count}`);
    }
    
    // Show first few examples
    lines.push('   Examples:');
    for (const s of skipped.slice(0, 3)) {
      lines.push(`   - [${s.section}] ${s.key} (${s.reason})`);
    }
    if (skipped.length > 3) {
      lines.push(`   ... and ${skipped.length - 3} more`);
    }
  }
  
  return lines.join('\n');
}
