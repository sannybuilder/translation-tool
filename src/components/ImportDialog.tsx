import React from 'react';

interface ImportDialogProps {
  isOpen: boolean;
  importText: string;
  importReport: string | null;
  isMobile?: boolean;
  onImportTextChange: (text: string) => void;
  onImport: () => void;
  onClose: () => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  importText,
  importReport,
  isMobile = false,
  onImportTextChange,
  onImport,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: isMobile ? '1rem' : '1.5rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #333'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? '1rem' : '1.25rem' }}>
            Import Translations
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: isMobile ? '0.8rem' : '0.9rem', marginBottom: '0.5rem' }}>
            Paste your translation data here:
          </label>
          <textarea
            value={importText}
            onChange={(e) => onImportTextChange(e.target.value)}
            placeholder={'Supported formats:\n• INI format: [Section]\\nkey=value\n• Git patch/diff format\n• GitHub issue format (with code blocks)'}
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>

        {importReport && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: importReport.includes('✅') ? '#1f3a1f' : '#3a1f1f',
              border: `1px solid ${importReport.includes('✅') ? '#4CAF50' : '#ff4444'}`,
              borderRadius: '4px',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: '#fff',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              maxHeight: '150px',
              overflowY: 'auto'
            }}
          >
            {importReport}
          </div>
        )}

        <div style={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.8rem', marginBottom: '1rem' }}>
          <strong>Note:</strong> Imported changes will be added as new change items that you can review and undo individually.
          If a key already has a pending change, it will be replaced with the imported value.
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={!importText.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: importText.trim() ? '#1976D2' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: importText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            Import Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
