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
  const [dragCounter, setDragCounter] = useState(0);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Identify if a file is likely the English base file
  const isEnglishFile = (filename: string): boolean => {
    const lowercaseName = filename.toLowerCase();
    return lowercaseName.includes('english') || 
           lowercaseName.includes('eng') || 
           lowercaseName === 'en.ini' ||
           lowercaseName === 'base.ini';
  };

  // Process dropped files
  const processDroppedFiles = async (files: File[]) => {
    // Filter only INI files
    const iniFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.ini')
    );

    if (iniFiles.length === 0) {
      onError('Please drop INI files only');
      return;
    }

    if (iniFiles.length > 2) {
      onError('Please drop exactly 2 INI files (base language and translation)');
      return;
    }

    setLoadingFiles(true);

    try {
      // Identify which file is English and which is translation
      let englishFile: File | null = null;
      let translationFile: File | null = null;

      if (iniFiles.length === 1) {
        // Single file dropped - determine if it's English or translation
        const file = iniFiles[0];
        if (isEnglishFile(file.name)) {
          englishFile = file;
          onError('Please also drop a translation file to edit');
        } else {
          translationFile = file;
          onError('Please also drop the English base file');
        }
        setLoadingFiles(false);
        return;
      } else if (iniFiles.length === 2) {
        // Two files dropped - identify which is which
        const [file1, file2] = iniFiles;
        
        if (isEnglishFile(file1.name)) {
          englishFile = file1;
          translationFile = file2;
        } else if (isEnglishFile(file2.name)) {
          englishFile = file2;
          translationFile = file1;
        } else {
          // Neither file is clearly English - use file names to guess
          // Assume the first one alphabetically is the base (English)
          const sortedFiles = iniFiles.sort((a, b) => a.name.localeCompare(b.name));
          englishFile = sortedFiles[0];
          translationFile = sortedFiles[1];
          console.log(`Guessing base language: ${englishFile.name}, translation: ${translationFile.name}`);
        }
      }

      if (englishFile && translationFile) {
        // Load both files
        const [englishContent, translationContent] = await Promise.all([
          readLocalFile(englishFile),
          readLocalFile(translationFile)
        ]);

        const englishData = parseIni(englishContent);
        const translationData = parseIni(translationContent);

        onFilesLoaded(
          englishData,
          translationData,
          englishFile.name,
          translationFile.name
        );
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
    
    setDragCounter(prev => prev + 1);
    
    // Check if dragging files
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);

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
  const isMedium = screenSize === 'medium';

  if (localEnglishFileName && localFileName) {
    // Files are already loaded, don't show the upload interface
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
            Drop 2 INI files (English base + translation)
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
            Welcome to Local File Mode
          </h3>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Drag and drop your INI files here, or use the buttons below
          </p>
          
          <div style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            maxWidth: '500px'
          }}>
            <h4 style={{ color: '#4CAF50', marginBottom: '1rem', fontSize: '1rem' }}>
              Quick Start:
            </h4>
            <ol style={{
              textAlign: 'left',
              color: '#aaa',
              lineHeight: '1.8',
              paddingLeft: '1.5rem',
              margin: 0
            }}>
              <li>Drag and drop <strong style={{ color: '#fff' }}>2 INI files</strong> onto this area</li>
              <li>The app will automatically identify:
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  <li>Base language (english.ini or similar)</li>
                  <li>Translation file (e.g., german.ini, french.ini)</li>
                </ul>
              </li>
              <li>Start editing immediately</li>
            </ol>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center'
          }}>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              Or open files manually:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label style={{
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}>
                {localEnglishFileName || 'Open english.ini'}
                <input
                  type="file"
                  accept=".ini"
                  onChange={onEnglishFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <label style={{
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}>
                {localFileName || 'Open translation'}
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
