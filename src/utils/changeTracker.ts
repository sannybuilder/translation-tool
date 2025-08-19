import type { TrackedChange } from '../types/changeTracking';
import type { IniData } from './iniParser';

const CHANGE_TRACKER_KEY = 'translation_changes_tracker';
const CHANGE_TRACKER_META_KEY = 'translation_changes_meta';

export class ChangeTracker {
  private changes: Map<string, TrackedChange> = new Map();
  public originalData: IniData = {}; // Made public for comparison
  private selectedTranslation: string = '';

  constructor(originalData: IniData, selectedTranslation?: string) {
    this.originalData = JSON.parse(JSON.stringify(originalData));
    this.selectedTranslation = selectedTranslation || '';
    this.loadChanges();
  }

  // Track a change to a translation entry
  trackChange(section: string, key: string, newValue: string): void {
    const id = `${section}-${key}`;
    const originalValue = this.originalData[section]?.[key] || '';

    // If value is reverted to original, remove from tracked changes
    if (newValue === originalValue) {
      this.changes.delete(id);
      this.saveChanges();
      return;
    }

    const existingChange = this.changes.get(id);
    
    this.changes.set(id, {
      id,
      section,
      key,
      originalValue,
      newValue,
      timestamp: Date.now(),
      submitted: existingChange?.submitted || false,
      submittedAt: existingChange?.submittedAt,
      prNumber: existingChange?.prNumber,
    });

    this.saveChanges();
  }

  // Get all unsubmitted changes
  getUnsubmittedChanges(): TrackedChange[] {
    return Array.from(this.changes.values())
      .filter(change => !change.submitted)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Get changes by section
  getChangesBySection(section: string): TrackedChange[] {
    return Array.from(this.changes.values())
      .filter(change => change.section === section)
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  // Mark changes as submitted
  markAsSubmitted(changeIds: string[], prNumber?: string): void {
    const now = Date.now();
    changeIds.forEach(id => {
      const change = this.changes.get(id);
      if (change) {
        change.submitted = true;
        change.submittedAt = now;
        if (prNumber) {
          change.prNumber = prNumber;
        }
      }
    });
    this.saveChanges();
  }

  // Clear submitted changes
  clearSubmittedChanges(): void {
    const unsubmitted = Array.from(this.changes.values())
      .filter(change => !change.submitted);
    
    this.changes.clear();
    unsubmitted.forEach(change => {
      this.changes.set(change.id, change);
    });
    
    this.saveChanges();
  }

  // Undo a specific change - returns the original value
  undoChange(changeId: string): string | null {
    const change = this.changes.get(changeId);
    if (change) {
      this.changes.delete(changeId);
      this.saveChanges();
      return change.originalValue;
    }
    return null;
  }

  // Undo all changes in a section - returns map of key to original value
  undoSection(section: string): Map<string, string> {
    const restoredValues = new Map<string, string>();
    const sectionChanges = Array.from(this.changes.values())
      .filter(change => change.section === section && !change.submitted);
    
    sectionChanges.forEach(change => {
      restoredValues.set(change.key, change.originalValue);
      this.changes.delete(change.id);
    });
    
    if (restoredValues.size > 0) {
      this.saveChanges();
    }
    
    return restoredValues;
  }

  // Undo all unsubmitted changes - returns map of section/key to original value
  undoAll(): Map<string, Map<string, string>> {
    const restoredValues = new Map<string, Map<string, string>>();
    const unsubmittedChanges = Array.from(this.changes.values())
      .filter(change => !change.submitted);
    
    unsubmittedChanges.forEach(change => {
      if (!restoredValues.has(change.section)) {
        restoredValues.set(change.section, new Map<string, string>());
      }
      restoredValues.get(change.section)!.set(change.key, change.originalValue);
      this.changes.delete(change.id);
    });
    
    if (restoredValues.size > 0) {
      this.saveChanges();
    }
    
    return restoredValues;
  }

  // Generate a diff/patch for selected changes
  generatePatch(changeIds: string[], format: 'diff' | 'json' | 'ini-snippet' = 'diff'): string {
    const selectedChanges = changeIds
      .map(id => this.changes.get(id))
      .filter(Boolean) as TrackedChange[];

    if (selectedChanges.length === 0) {
      return '';
    }

    switch (format) {
      case 'diff':
        return this.generateUnifiedDiff(selectedChanges);
      case 'json':
        return JSON.stringify(selectedChanges, null, 2);
      case 'ini-snippet':
        return this.generateIniSnippet(selectedChanges);
      default:
        return '';
    }
  }

  private generateUnifiedDiff(changes: TrackedChange[]): string {
    const lines: string[] = [];
    const groupedBySection = this.groupChangesBySection(changes);

    Object.entries(groupedBySection).forEach(([section, sectionChanges]) => {
      lines.push(`--- [${section}]`);
      lines.push(`+++ [${section}]`);
      
      sectionChanges.forEach(change => {
        lines.push(`@@ ${change.key} @@`);
        if (change.originalValue) {
          lines.push(`-${change.key}=${change.originalValue}`);
        }
        lines.push(`+${change.key}=${change.newValue}`);
      });
      lines.push('');
    });

    return lines.join('\n');
  }

  private generateIniSnippet(changes: TrackedChange[]): string {
    const lines: string[] = [];
    const groupedBySection = this.groupChangesBySection(changes);

    Object.entries(groupedBySection).forEach(([section, sectionChanges]) => {
      lines.push(`[${section}]`);
      sectionChanges.forEach(change => {
        lines.push(`${change.key}=${change.newValue}`);
      });
      lines.push('');
    });

    return lines.join('\n');
  }

  private groupChangesBySection(changes: TrackedChange[]): Record<string, TrackedChange[]> {
    return changes.reduce((acc, change) => {
      if (!acc[change.section]) {
        acc[change.section] = [];
      }
      acc[change.section].push(change);
      return acc;
    }, {} as Record<string, TrackedChange[]>);
  }

  // Get statistics about changes
  getStats(): {
    total: number;
    submitted: number;
    pending: number;
    sections: number;
  } {
    const changes = Array.from(this.changes.values());
    const sections = new Set(changes.map(c => c.section));
    
    return {
      total: changes.length,
      submitted: changes.filter(c => c.submitted).length,
      pending: changes.filter(c => !c.submitted).length,
      sections: sections.size,
    };
  }

  // Reset the tracker with new original data
  reset(newOriginalData: IniData): void {
    this.originalData = JSON.parse(JSON.stringify(newOriginalData));
    this.changes.clear();
    // Clear localStorage when resetting
    try {
      localStorage.removeItem(CHANGE_TRACKER_KEY);
      localStorage.removeItem(CHANGE_TRACKER_META_KEY);
    } catch (error) {
      console.error('Failed to clear tracked changes:', error);
    }
  }

  private loadChanges(): void {
    try {
      const saved = localStorage.getItem(CHANGE_TRACKER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.changes = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load tracked changes:', error);
    }
  }

  private saveChanges(): void {
    try {
      const toSave = Object.fromEntries(this.changes.entries());
      localStorage.setItem(CHANGE_TRACKER_KEY, JSON.stringify(toSave));
      // Also save metadata including the selected translation
      if (this.changes.size > 0) {
        localStorage.setItem(CHANGE_TRACKER_META_KEY, JSON.stringify({
          selectedTranslation: this.selectedTranslation,
          lastUpdated: Date.now()
        }));
      } else {
        // Clear metadata if no changes remain
        localStorage.removeItem(CHANGE_TRACKER_META_KEY);
      }
    } catch (error) {
      console.error('Failed to save tracked changes:', error);
    }
  }

  // Get the selected translation associated with these changes
  getSelectedTranslation(): string {
    return this.selectedTranslation;
  }

  // Set the selected translation
  setSelectedTranslation(translation: string): void {
    this.selectedTranslation = translation;
    this.saveChanges(); // Save metadata when translation changes
  }

  // Static method to check if there are pending changes and get the language
  static getPendingChangesLanguage(): string | null {
    try {
      const meta = localStorage.getItem(CHANGE_TRACKER_META_KEY);
      const changes = localStorage.getItem(CHANGE_TRACKER_KEY);
      if (meta && changes) {
        const parsedChanges = JSON.parse(changes);
        // Only return language if there are actual pending changes
        if (Object.keys(parsedChanges).length > 0) {
          const parsed = JSON.parse(meta);
          return parsed.selectedTranslation || null;
        }
      }
    } catch (error) {
      console.error('Failed to load change tracker metadata:', error);
    }
    return null;
  }
}

// Submission history functionality has been removed
