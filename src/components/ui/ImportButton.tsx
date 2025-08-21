import React from 'react';

interface ImportButtonProps {
  onClick: () => void;
  isMobile?: boolean;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onClick, isMobile = false }) => {
  return (
    <div style={{ 
      padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', 
      borderBottom: '1px solid #333', 
      display: 'flex', 
      gap: '0.5rem', 
      alignItems: 'center' 
    }}>
      <button 
        onClick={onClick} 
        style={{ 
          padding: isMobile ? '0.4rem 0.6rem' : '0.25rem 0.75rem', 
          backgroundColor: '#1976D2', 
          color: '#fff', 
          border: '1px solid #1976D2', 
          borderRadius: '4px', 
          fontSize: isMobile ? '0.8rem' : '0.85rem', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }} 
        title="Import translations from clipboard or file"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
        Import Submissions
      </button>
      <span style={{ 
        color: '#888', 
        fontSize: isMobile ? '0.75rem' : '0.8rem' 
      }}>
        Paste translations from clipboard or GitHub issues
      </span>
    </div>
  );
};

export default ImportButton;
