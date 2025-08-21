import { useState } from 'react';
import { ChangeTracker } from '../utils/changeTracker';
import { parseImportedData, formatImportReport } from '../utils/importParser';
import type { IniData } from '../utils/iniParser';

interface UseImportTranslationsProps {
  changeTracker: ChangeTracker | null;
  translationData: IniData;
  onImportChanges?: (section: string, key: string, newValue: string) => void;
  onChangesImported?: () => void;
}

interface UseImportTranslationsReturn {
  showImportDialog: boolean;
  importText: string;
  importReport: string | null;
  setShowImportDialog: (show: boolean) => void;
  setImportText: (text: string) => void;
  handleImport: () => void;
  clearImport: () => void;
}

export function useImportTranslations({
  changeTracker,
  translationData,
  onImportChanges,
  onChangesImported
}: UseImportTranslationsProps): UseImportTranslationsReturn {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [importReport, setImportReport] = useState<string | null>(null);

  const handleImport = () => {
    if (!changeTracker || !onImportChanges || !importText.trim()) return;

    // Parse the imported data
    const parseResult = parseImportedData(importText);
    
    if (parseResult.errors.length > 0) {
      setImportReport(`⚠️ Parse errors:\n${parseResult.errors.join('\n')}`);
      return;
    }

    if (parseResult.changes.length === 0) {
      setImportReport('⚠️ No valid changes found in the imported data');
      return;
    }

    // Import the changes using the change tracker
    const importResult = changeTracker.importChanges(
      parseResult.changes.map(c => ({ 
        section: c.section, 
        key: c.key, 
        value: c.value 
      })),
      translationData
    );

    // Apply the imported changes to the actual translation data
    for (const change of importResult.imported) {
      onImportChanges(change.section, change.key, change.value);
    }

    // Generate and display the import report
    const report = formatImportReport(
      importResult.imported,
      importResult.skipped,
      importResult.replaced
    );
    
    setImportReport(report);
    
    // Clear import text if successful
    if (importResult.imported.length > 0) {
      setImportText('');
      
      // Notify that changes were imported
      if (onChangesImported) {
        onChangesImported();
      }
      
      // Close dialog after a delay if everything was imported
      if (importResult.skipped.length === 0) {
        setTimeout(() => {
          setShowImportDialog(false);
          setImportReport(null);
        }, 2000);
      }
    }
  };

  const clearImport = () => {
    setShowImportDialog(false);
    setImportReport(null);
    setImportText('');
  };

  return {
    showImportDialog,
    importText,
    importReport,
    setShowImportDialog,
    setImportText,
    handleImport,
    clearImport
  };
}
