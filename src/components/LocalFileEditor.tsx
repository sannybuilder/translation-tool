import React, { useState, useCallback } from 'react';
import { readLocalFile } from '../utils/githubCache';
import { parseIni } from '../utils/iniParser';
import type { IniData } from '../utils/iniParser';

interface LocalFileEditorProps {
  onFilesLoaded: (englishData: IniData, translationData: IniData, englishFileName: string, translationFileName: string) => void;
  onError: (error: string) => void;
  localEnglishFileName: string;
  localFileName: string;
  onEnglishFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTranslationFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const LocalFileEditor: React.FC<LocalFileEditorProps> = ({
  onFilesLoaded,
  onError,
  localEnglishFileName,
  localFileName,
  onEnglishFileUpload,
  onTranslationFileUpload,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const isEnglishFile = (filename: string): boolean => {
    const lowercaseName = filename.toLowerCase();
    return lowercaseName.includes('english') || 
           lowercaseName.includes('eng') || 
           lowercaseName === 'en.ini' ||
           lowercaseName === 'base.ini';
  };
  const processDroppedFiles = async (files: File[]) => {
    const iniFiles = files.filter(file => file.name.toLowerCase().endsWith('.ini'));

    if (iniFiles.length === 0) {
      onError('Please drop INI files only');
      return;
    }

    if (iniFiles.length > 2) {
      onError('Please drop at most 2 INI files (base language and translation)');
      return;
    }

    setLoadingFiles(true);

    try {
      let englishFile: File | null = null;
      let translationFile: File | null = null;

      if (iniFiles.length === 1) {
        const file = iniFiles[0];
        const fileContent = await readLocalFile(file);
        const parsedData = parseIni(fileContent);

        if (isEnglishFile(file.name)) {
          englishFile = file;
          onFilesLoaded(parsedData, {}, file.name, '');
        } else {
          translationFile = file;
          onFilesLoaded({}, parsedData, '', file.name);
        }
      } else if (iniFiles.length === 2) {
        const [file1, file2] = iniFiles;

        if (isEnglishFile(file1.name)) {
          englishFile = file1;
          translationFile = file2;
        } else if (isEnglishFile(file2.name)) {
          englishFile = file2;
          translationFile = file1;
        } else {
          const sortedFiles = iniFiles.sort((a, b) => a.name.localeCompare(b.name));
          englishFile = sortedFiles[0];
          translationFile = sortedFiles[1];
          console.log(`Guessing base language: ${englishFile.name}, translation: ${translationFile.name}`);
        }

        const [englishContent, translationContent] = await Promise.all([
          readLocalFile(englishFile),
          readLocalFile(translationFile),
        ]);

        const englishData = parseIni(englishContent);
        const translationData = parseIni(translationContent);

        onFilesLoaded(englishData, translationData, englishFile.name, translationFile.name);
      }
    } catch (err) {
      console.error('Error processing dropped files:', err);
      onError('Failed to process dropped files');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if dragging files
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
  // When drag leaves, clear dragging state
  setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
  setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processDroppedFiles(files);
    }
  }, []);

  // Check screen size for responsive design
  const screenSize = (() => {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'medium';
    return 'desktop';
  })();

  const isMobile = screenSize === 'mobile';

  if (localEnglishFileName && localFileName) {
    // Both files are loaded, don't show the upload interface
    return null;
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        backgroundColor: isDragging ? '#1f1f1f' : '#1a1a1a',
        border: isDragging ? '2px dashed #4CAF50' : '1px solid #333',
        borderRadius: '8px',
        padding: isMobile ? '1.5rem' : '2rem',
        textAlign: 'center',
        marginTop: '2rem',
        transition: 'all 0.3s ease',
        position: 'relative',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {loadingFiles ? (
        <div style={{ color: '#4CAF50' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading files...</p>
        </div>
      ) : isDragging ? (
        <div style={{ color: '#4CAF50' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Drop INI files here</h3>
          <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
            Drop 1 or 2 INI files (English base and/or translation)
          </p>
        </div>
      ) : (
        <>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            opacity: 0.5,
            filter: 'grayscale(100%)'
          }}>
            📁
          </div>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
            Local Translations
          </h3>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Drag and drop your INI files here, or use the buttons below
          </p>
          
          {/* Show file status */}
          {(localEnglishFileName || localFileName) && (
            <div style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #444',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1.5rem',
              maxWidth: '500px'
            }}>
              <h4 style={{ color: '#4CAF50', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Loaded Files:
              </h4>
              <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                {localEnglishFileName && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    ✅ English: <span style={{ color: '#fff' }}>{localEnglishFileName}</span>
                  </div>
                )}
                {localFileName && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    ✅ Translation: <span style={{ color: '#fff' }}>{localFileName}</span>
                  </div>
                )}
                {!localEnglishFileName && (
                  <div style={{ marginBottom: '0.25rem', color: '#666' }}>
                    ⏳ English file: not loaded
                  </div>
                )}
                {!localFileName && (
                  <div style={{ marginBottom: '0.25rem', color: '#666' }}>
                    ⏳ Translation file: not loaded
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            maxWidth: '500px'
          }}>
            <h4 style={{ color: '#4CAF50', marginBottom: '1rem', fontSize: '1rem' }}>
              Quick Start
            </h4>
            <ol style={{
              textAlign: 'left',
              color: '#aaa',
              lineHeight: '1.8',
              paddingLeft: '1.5rem',
              margin: 0
            }}>
              <li>Drop or open the base and translation <strong style={{ color: '#fff' }}>.ini</strong> files.</li>
              <li>The app uses <strong style={{ color: '#fff' }}>english.ini</strong> as the default base file; you can open a different file manually if needed.</li>
              <li>Edit translations and click "Save" to download your changes.</li>
            </ol>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center'
          }}>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              Or open manually:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label style={{
                backgroundColor: localEnglishFileName ? '#2d4a2d' : '#2a2a2a',
                color: '#fff',
                border: localEnglishFileName ? '1px solid #4CAF50' : '1px solid #444',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}>
                {localEnglishFileName ? `✅ ${localEnglishFileName}` : 'Open base file'}
                <input
                  type="file"
                  accept=".ini"
                  onChange={onEnglishFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <label style={{
                backgroundColor: localFileName ? '#2d4a2d' : '#2a2a2a',
                color: '#fff',
                border: localFileName ? '1px solid #4CAF50' : '1px solid #444',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}>
                {localFileName ? `✅ ${localFileName}` : 'Open translation file'}
                <input
                  type="file"
                  accept=".ini"
                  onChange={onTranslationFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <p style={{ 
            color: '#666', 
            marginTop: '1.5rem', 
            fontSize: '0.85rem',
            fontStyle: 'italic'
          }}>
            Supported: All Sanny Builder translation files (.ini format)
          </p>
        </>
      )}
    </div>
  );
};

export default LocalFileEditor;
