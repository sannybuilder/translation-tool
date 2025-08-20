import React, { useState, useCallback } from 'react';
import { readLocalFile, fetchGitHubFileList } from '../utils/githubCache';
import type { IniData } from '../utils/iniParser';

interface LocalFileEditorProps {
  onFilesLoaded: (
    englishData: IniData,
    translationData: IniData,
    englishFileName: string,
    translationFileName: string,
  ) => void;
  onError: (error: string) => void;
  localEnglishFileName: string;
  localFileName: string;
  onEnglishFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTranslationFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGitHubBaseFileLoad?: (englishData: IniData, englishFileName: string) => void;
}

const LocalFileEditor: React.FC<LocalFileEditorProps> = ({
  onFilesLoaded,
  onError,
  localEnglishFileName,
  localFileName,
  onEnglishFileUpload,
  onTranslationFileUpload,
  onGitHubBaseFileLoad,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingGitHub, setLoadingGitHub] = useState(false);

  const isEnglishFile = (filename: string): boolean => {
    const lowercaseName = filename.toLowerCase();
    return (
      lowercaseName.includes('english') ||
      lowercaseName.includes('eng') ||
      lowercaseName === 'en.ini' ||
      lowercaseName === 'base.ini'
    );
  };
  const processDroppedFiles = async (files: File[]) => {
    const iniFiles = files.filter((file) => file.name.toLowerCase().endsWith('.ini'));

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
        const parsedData = await readLocalFile(file);

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

        const [englishData, translationData] = await Promise.all([
          readLocalFile(englishFile),
          readLocalFile(translationFile),
        ]);

        onFilesLoaded(englishData, translationData, englishFile.name, translationFile.name);
      }
    } catch (err) {
      console.error('Error processing dropped files:', err);
      onError('Failed to process dropped files');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Handle loading base translation from GitHub
  const handleGitHubBaseFileLoad = async () => {
    if (!onGitHubBaseFileLoad) return;
    
    setLoadingGitHub(true);
    try {
      const { englishData } = await fetchGitHubFileList();
      onGitHubBaseFileLoad(englishData, 'english.ini (from GitHub)');
    } catch (err) {
      console.error('Error loading GitHub base file:', err);
      onError('Failed to load base translation from GitHub. Please try again or use a local file.');
    } finally {
      setLoadingGitHub(false);
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
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {loadingFiles || loadingGitHub ? (
        <div style={{ color: '#4CAF50' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>{loadingFiles ? 'Loading files...' : 'Loading from GitHub...'}</p>
        </div>
      ) : isDragging ? (
        <div style={{ color: '#4CAF50' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Drop INI files here</h3>
          <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Drop 1 or 2 INI files (base and/or translation)</p>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              opacity: 0.6,
            }}
          >
            📁
          </div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Load Translation Files</h3>
          <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Choose how to load your files
          </p>

          {/* File Status - only show when files are loaded */}
          {(localEnglishFileName || localFileName) && (
            <div
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '2rem',
                maxWidth: '400px',
                width: '100%',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                {localEnglishFileName && (
                  <div style={{ marginBottom: '0.25rem', color: '#4CAF50' }}>
                    ✅ Base: <span style={{ color: '#fff' }}>{localEnglishFileName}</span>
                  </div>
                )}
                {localFileName && (
                  <div style={{ marginBottom: '0.25rem', color: '#4CAF50' }}>
                    ✅ Translation: <span style={{ color: '#fff' }}>{localFileName}</span>
                  </div>
                )}
                {!localEnglishFileName && (
                  <div style={{ marginBottom: '0.25rem', color: '#666' }}>⏳ Base file needed</div>
                )}
                {!localFileName && (
                  <div style={{ marginBottom: '0.25rem', color: '#666' }}>⏳ Translation file needed</div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Select Base File */}
          <div
            style={{
              marginBottom: '2rem',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <h4
              style={{
                color: '#4CAF50',
                marginBottom: '1rem',
                fontSize: '1rem',
                textAlign: 'center',
              }}
            >
              Step 1: Select Base File
            </h4>
            
                         <div
               style={{
                 display: 'flex',
                 flexDirection: isMobile ? 'column' : 'row',
                 gap: '1rem',
                 marginBottom: '1rem',
                 alignItems: 'center',
                 justifyContent: 'center',
               }}
             >
               {/* GitHub Base File Option */}
               {!localEnglishFileName && onGitHubBaseFileLoad && (
                 <button
                   onClick={handleGitHubBaseFileLoad}
                   disabled={loadingGitHub}
                   style={{
                     backgroundColor: '#2a2a2a',
                     color: '#fff',
                     border: '1px solid #444',
                     padding: '1rem',
                     borderRadius: '6px',
                     cursor: loadingGitHub ? 'not-allowed' : 'pointer',
                     fontSize: '0.9rem',
                     transition: 'all 0.3s ease',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     gap: '0.5rem',
                     minWidth: '200px',
                   }}
                 >
                   <span style={{ fontSize: '1.5rem' }}>🌐</span>
                   <span>Load from GitHub</span>
                   <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Official english.ini</span>
                 </button>
               )}

               {/* OR separator */}
               {!localEnglishFileName && onGitHubBaseFileLoad && (
                 <div
                   style={{
                     textAlign: 'center',
                     color: '#666',
                     fontSize: '0.9rem',
                     fontStyle: 'italic',
                     padding: '0 0.5rem',
                   }}
                 >
                   OR
                 </div>
               )}

               {/* Local Base File Option */}
               <label
                 style={{
                   backgroundColor: localEnglishFileName ? '#2d4a2d' : '#2a2a2a',
                   color: '#fff',
                   border: localEnglishFileName ? '1px solid #4CAF50' : '1px solid #444',
                   padding: '1rem',
                   borderRadius: '6px',
                   cursor: 'pointer',
                   fontSize: '0.9rem',
                   transition: 'all 0.3s ease',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   gap: '0.5rem',
                   minWidth: '200px',
                 }}
               >
                 <span style={{ fontSize: '1.5rem' }}>
                   {localEnglishFileName ? '✅' : '📄'}
                 </span>
                 <span>{localEnglishFileName ? 'Base File' : 'Open Local File'}</span>
                 <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                   {localEnglishFileName ? localEnglishFileName : 'english.ini'}
                 </span>
                 <input type="file" accept=".ini" onChange={onEnglishFileUpload} style={{ display: 'none' }} />
               </label>
             </div>
          </div>

          {/* Step 2: Open Translation File */}
          <div
            style={{
              marginBottom: '2rem',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <h4
              style={{
                color: '#4CAF50',
                marginBottom: '1rem',
                fontSize: '1rem',
                textAlign: 'center',
              }}
            >
              Step 2: Open Translation File
            </h4>
            
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <label
                style={{
                  backgroundColor: localFileName ? '#2d4a2d' : '#2a2a2a',
                  color: '#fff',
                  border: localFileName ? '1px solid #4CAF50' : '1px solid #444',
                  padding: '1rem 2rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '200px',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>
                  {localFileName ? '✅' : '🌍'}
                </span>
                <span>{localFileName ? 'Translation File' : 'Open Translation'}</span>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  {localFileName ? localFileName : 'Your language.ini file'}
                </span>
                <input type="file" accept=".ini" onChange={onTranslationFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Drag & Drop Hint */}
          <p
            style={{
              color: '#666',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}
          >
            or drag & drop INI files anywhere in this area
          </p>
        </>
      )}
    </div>
  );
};

export default LocalFileEditor;
