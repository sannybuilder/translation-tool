import { useState, useEffect } from 'react';
import Header from './components/Header';
import TranslationRow from './components/TranslationRow';
import LocalFileEditor from './components/LocalFileEditor';
import { parseIni, serializeIni, countFormatSpecifiers } from './utils/iniParser';
import type { IniData } from './utils/iniParser';
import type { TranslationEntry } from './types/translation';
import {
  getCachedData,
  setCachedData,
  fetchGitHubFileList,
  fetchTranslationFile,
  readLocalFile
} from './utils/githubCache';
import './App.css';

type SourceMode = 'github' | 'local';
type FilterMode = 'all' | 'untranslated' | 'invalid';

function App() {
  const [englishData, setEnglishData] = useState<IniData>({});
  const [translationData, setTranslationData] = useState<IniData>({});
  const [originalTranslationData, setOriginalTranslationData] = useState<IniData>({});
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');
  const [availableTranslations, setAvailableTranslations] = useState<string[]>([]);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({ total: 0, untranslated: 0, invalid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>('github');
  const [localFileName, setLocalFileName] = useState<string>('');
  const [localEnglishFileName, setLocalEnglishFileName] = useState<string>('');
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [githubInitiallyFailed, setGithubInitiallyFailed] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  
  // Check screen size for responsive design
  const [screenSize, setScreenSize] = useState(() => {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'medium';
    return 'desktop';
  });
  
  const isMobile = screenSize === 'mobile';
  const isMedium = screenSize === 'medium';

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setScreenSize('mobile');
      } else if (width <= 1024) {
        setScreenSize('medium');
      } else {
        setScreenSize('desktop');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle local English file upload
  const handleEnglishFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const content = await readLocalFile(file);
      const parsed = parseIni(content);
      setEnglishData(parsed);
      setLocalEnglishFileName(file.name);
    } catch (err) {
      console.error('Error loading local English file:', err);
      setError('Failed to load English file');
    }
  };

  // Handle local translation file upload
  const handleTranslationFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const content = await readLocalFile(file);
      const parsed = parseIni(content);
      setTranslationData(parsed);
      setOriginalTranslationData(JSON.parse(JSON.stringify(parsed)));
      setHasChanges(false);
      setLocalFileName(file.name);
    } catch (err) {
      console.error('Error loading local translation file:', err);
      setError('Failed to load translation file');
    }
  };

  // Handle files loaded via drag and drop
  const handleFilesLoaded = (
    englishData: IniData,
    translationData: IniData,
    englishFileName: string,
    translationFileName: string
  ) => {
    setEnglishData(englishData);
    setTranslationData(translationData);
    setOriginalTranslationData(JSON.parse(JSON.stringify(translationData)));
    setLocalEnglishFileName(englishFileName);
    setLocalFileName(translationFileName);
    setHasChanges(false);
    setError(null);
  };

  // Fetch available translations from GitHub
  useEffect(() => {
    if (sourceMode === 'local') {
      setLoading(false);
      // setIsUsingCache(false);
      return;
    }

    const fetchAvailableTranslations = async () => {
      setLoading(true);
      setError(null);
      
      // After initial load, always use cache when switching between modes
      if (hasInitiallyLoaded) {
        const cachedFileList = getCachedData<string[]>('github_file_list');
        const cachedEnglishData = getCachedData<IniData>('english_ini');
        
        if (cachedFileList && cachedEnglishData) {
          console.log('Using cached data (mode switch after initial load)');
          // Only set isUsingCache if GitHub initially failed
          // This ensures the "cached" label only appears when GitHub was unavailable
          if (githubInitiallyFailed) {
            setIsUsingCache(true);
            setError('GitHub unavailable. Using cached data.');
          }
          setAvailableTranslations(cachedFileList);
          setEnglishData(cachedEnglishData);
          
          // Set default selection to the first available translation
          if (cachedFileList.length > 0) {
            setSelectedTranslation(cachedFileList[0]);
          }
          
          setLoading(false);
          return;
        }
      }
      
      // Initial load or no cache available - try to fetch fresh data
      try {
        console.log('Attempting to fetch fresh data from GitHub');
        
        // Try to fetch from GitHub first
        const { files: iniFiles, englishData } = await fetchGitHubFileList();
        
        // Success! Update cache with fresh data
        console.log('Successfully fetched fresh data from GitHub');
        setCachedData('github_file_list', iniFiles);
        setCachedData('english_ini', englishData);
        
        setIsUsingCache(false);
        setGithubInitiallyFailed(false); // GitHub succeeded
        setAvailableTranslations(iniFiles);
        setEnglishData(englishData);
        setHasInitiallyLoaded(true);
        
        // Set default selection to the first available translation
        if (iniFiles.length > 0) {
          setSelectedTranslation(iniFiles[0]);
        }
        
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching from GitHub, attempting to use cache:', err);
        
        // GitHub failed, try to load from cache
        const cachedFileList = getCachedData<string[]>('github_file_list');
        const cachedEnglishData = getCachedData<IniData>('english_ini');
        
        if (cachedFileList && cachedEnglishData) {
          console.log('Using cached data (GitHub unavailable)');
          setIsUsingCache(true);
          setGithubInitiallyFailed(true); // Track that GitHub initially failed
          setAvailableTranslations(cachedFileList);
          setEnglishData(cachedEnglishData);
          setHasInitiallyLoaded(true);
          
          // Set default selection to the first available translation
          if (cachedFileList.length > 0) {
            setSelectedTranslation(cachedFileList[0]);
          }
          
          // Show a message that we're using cached data
          const errorMessage = 'GitHub unavailable. Using cached data.';
          setError(errorMessage);
          setLoading(false);
        } else {
          // No cache available, show error
          const errorMessage = err instanceof Error ? 
            `${err.message} Please try again or use local files.` : 
            'Failed to load translations from GitHub. Please try again or use local files.';
          setError(errorMessage);
          setLoading(false);
        }
      }
    };
    
    fetchAvailableTranslations();
  }, [sourceMode, hasInitiallyLoaded, githubInitiallyFailed]);

  // Load selected translation from GitHub
  useEffect(() => {
    if (selectedTranslation && sourceMode === 'github') {
      const loadTranslation = async () => {
        const cacheKey = `translation_${selectedTranslation}`;
        
        // After initial load, always use cache when available
        if (hasInitiallyLoaded) {
          const cachedTranslation = getCachedData<IniData>(cacheKey);
          
          if (cachedTranslation) {
            console.log(`Using cached data for ${selectedTranslation} (mode switch after initial load)`);
            setTranslationData(cachedTranslation);
            setOriginalTranslationData(JSON.parse(JSON.stringify(cachedTranslation)));
            setHasChanges(false);
            setError(null); // Clear any error since we're successfully using cache
            return;
          }
        }
        
        // Initial load or no cache - try to fetch fresh data
        try {
          setError(null); // Clear any previous errors
          
          console.log(`Attempting to fetch fresh data for ${selectedTranslation}`);
          
          // Try to fetch from GitHub first
          const parsed = await fetchTranslationFile(selectedTranslation);
          
          // Success! Update cache with fresh data
          console.log(`Successfully fetched fresh data for ${selectedTranslation}`);
          setCachedData(cacheKey, parsed);
          
          setTranslationData(parsed);
          setOriginalTranslationData(JSON.parse(JSON.stringify(parsed))); // Deep clone to avoid reference issues
          setHasChanges(false);
          
        } catch (error) {
          console.error(`Error fetching ${selectedTranslation} from GitHub, attempting to use cache:`, error);
          
          // GitHub failed, try to load from cache
          const cachedTranslation = getCachedData<IniData>(cacheKey);
          
          if (cachedTranslation) {
            console.log(`Using cached data for ${selectedTranslation} (GitHub unavailable)`);
            setTranslationData(cachedTranslation);
            setOriginalTranslationData(JSON.parse(JSON.stringify(cachedTranslation)));
            setHasChanges(false);
            
            // Show a message that we're using cached data
            const errorMessage = 'GitHub unavailable. Using cached data.';
            setError(errorMessage);
          } else {
            // No cache available, show error
            const errorMessage = error instanceof Error ? 
              `${error.message} Please try again or switch to local files.` : 
              `Failed to load ${selectedTranslation}. Please try again or switch to local files.`;
            setError(errorMessage);
          }
        }
      };
      
      loadTranslation();
    }
  }, [selectedTranslation, sourceMode, hasInitiallyLoaded]);

  // Process entries when data changes
  useEffect(() => {
    const processedEntries: TranslationEntry[] = [];
    let untranslatedCount = 0;
    let invalidCount = 0;

    Object.keys(englishData).forEach(section => {
      // Skip the root section (empty string) which contains LANGID
      if (section === '') return;
      
      Object.keys(englishData[section]).forEach(key => {
        const englishText = englishData[section][key];
        const translatedText = translationData[section]?.[key] || '';
        
        let status: TranslationEntry['status'] = 'translated';
        if (!translatedText) {
          status = 'missing';
          untranslatedCount++;
        } else if (translatedText === englishText) {
          status = 'same';
          untranslatedCount++;
        }

        // Check if format specifiers match
        let isInvalid = false;
        if (translatedText && status === 'translated') {
          const englishSpecifiers = countFormatSpecifiers(englishText);
          const translationSpecifiers = countFormatSpecifiers(translatedText);
          
          if (englishSpecifiers.percentD !== translationSpecifiers.percentD ||
              englishSpecifiers.percentS !== translationSpecifiers.percentS) {
            isInvalid = true;
            invalidCount++;
          }
        }

        processedEntries.push({
          section,
          key,
          englishText,
          translatedText,
          status,
          isInvalid
        });
      });
    });

    setEntries(processedEntries);
    setStats({
      total: processedEntries.length,
      untranslated: untranslatedCount,
      invalid: invalidCount
    });
  }, [englishData, translationData]);

  const handleTranslationChange = (section: string, key: string, value: string) => {
    // Create a deep clone of the translation data
    const newTranslationData = JSON.parse(JSON.stringify(translationData));
    
    if (!newTranslationData[section]) {
      newTranslationData[section] = {};
    }
    
    newTranslationData[section][key] = value;
    setTranslationData(newTranslationData);
    
    // Compare with original to detect changes
    // First check if the specific value has changed
    const originalValue = originalTranslationData[section]?.[key] || '';
    const hasChanged = value !== originalValue;
    
    // Or do a full comparison to catch any changes
    const fullComparison = JSON.stringify(newTranslationData) !== JSON.stringify(originalTranslationData);
    
    setHasChanges(hasChanged || fullComparison);
  };

  const handleSave = () => {
    const content = serializeIni(translationData);
    
    // Save as UTF-8 to support all Unicode characters (Armenian, Russian, etc.)
    // UTF-8 is backward compatible with ASCII, so English and German files will work fine too
    const blob = new Blob([content], { 
      type: 'text/plain;charset=utf-8' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sourceMode === 'github' ? selectedTranslation : localFileName || 'translation.ini';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update original data after save (deep clone to avoid reference issues)
    setOriginalTranslationData(JSON.parse(JSON.stringify(translationData)));
    setHasChanges(false);
  };

  // Handle source mode change
  const handleSourceModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    setError(null);
    if (mode === 'local') {
      // Clear all data and GitHub-specific state when switching to local
      setEnglishData({});
      setTranslationData({});
      setOriginalTranslationData({});
      setEntries([]);
      setSelectedTranslation('');
      setAvailableTranslations([]);
      setStats({ total: 0, untranslated: 0, invalid: 0 });
      setHasChanges(false);
      // Preserve hasInitiallyLoaded and githubInitiallyFailed
    } else {
      // Clear local-specific state when switching to GitHub
      setLocalFileName('');
      setLocalEnglishFileName('');
      // isUsingCache will be set by the useEffect based on githubInitiallyFailed
    }
  };


  // Filter entries based on filter mode
  const filteredEntries = entries.filter(entry => {
    switch (filterMode) {
      case 'untranslated':
        return entry.status === 'missing' || entry.status === 'same';
      case 'invalid':
        return entry.isInvalid === true;
      case 'all':
      default:
        return true;
    }
  });

  // Group filtered entries by section
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.section]) {
      acc[entry.section] = [];
    }
    acc[entry.section].push(entry);
    return acc;
  }, {} as Record<string, TranslationEntry[]>);

  // Show loading state
  if (loading && sourceMode === 'github') {
    return (
      <div className="app">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#fff',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.2rem' }}>
            Loading translations from GitHub...
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem' }}>
            This may take a few seconds
          </div>
        </div>
      </div>
    );
  }

  // Show error state for GitHub but allow switching to local mode
  if (error && sourceMode === 'github' && !entries.length) {
    return (
      <div className="app">
        <Header
          availableTranslations={availableTranslations}
          selectedTranslation={selectedTranslation}
          onTranslationChange={setSelectedTranslation}
          onSave={handleSave}
          hasChanges={hasChanges}
          totalKeys={stats.total}
          untranslatedKeys={stats.untranslated}
          invalidKeys={stats.invalid}
          filterMode={filterMode}
          onFilterChange={setFilterMode}
          sourceMode={sourceMode}
          onSourceModeChange={handleSourceModeChange}
          localFileName={localFileName}
          localEnglishFileName={localEnglishFileName}
          onEnglishFileUpload={handleEnglishFileUpload}
          onTranslationFileUpload={handleTranslationFileUpload}
        />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          padding: '2rem',
          color: '#fff'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ff9800', marginBottom: '1rem' }}>
              GitHub Connection Failed
            </h2>
            <p style={{ color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {error}
            </p>
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: '#fff', marginBottom: '1rem', fontWeight: 'bold' }}>
                You can still work with local files:
              </p>
              <ol style={{ 
                textAlign: 'left', 
                color: '#aaa',
                lineHeight: '1.8',
                paddingLeft: '1.5rem'
              }}>
                <li>Click "Local Files" button above</li>
                <li>Upload your english.ini file</li>
                <li>Upload the translation file you want to edit</li>
                <li>Start editing translations offline</li>
              </ol>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleSourceModeChange('local')}
                style={{
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Switch to Local Files
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Retry GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
              <Header
          availableTranslations={availableTranslations}
          selectedTranslation={selectedTranslation}
          onTranslationChange={setSelectedTranslation}
          onSave={handleSave}
          hasChanges={hasChanges}
          totalKeys={stats.total}
          untranslatedKeys={stats.untranslated}
          invalidKeys={stats.invalid}
          filterMode={filterMode}
          onFilterChange={setFilterMode}
          sourceMode={sourceMode}
          onSourceModeChange={handleSourceModeChange}
          localFileName={localFileName}
          localEnglishFileName={localEnglishFileName}
          onEnglishFileUpload={handleEnglishFileUpload}
          onTranslationFileUpload={handleTranslationFileUpload}
          isUsingCache={isUsingCache}
        />
      
      {error && sourceMode === 'github' && (
        <div style={{
          backgroundColor: isUsingCache ? '#4CAF501a' : '#ff98001a',
          color: isUsingCache ? '#4CAF50' : '#ff9800',
          padding: '1rem 2rem',
          borderBottom: isUsingCache ? '1px solid #4CAF50' : '1px solid #ff9800',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <span>{error}</span>
          {!isUsingCache && (
            <button
              onClick={() => handleSourceModeChange('local')}
              style={{
                backgroundColor: '#ff9800',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              Switch to Local Mode
            </button>
          )}
        </div>
      )}
      
      <main style={{
        padding: isMobile ? '1rem' : isMedium ? '1.5rem' : '2rem',
        maxWidth: isMedium ? '900px' : '1200px',
        margin: '0 auto'
      }}>
        {sourceMode === 'local' && (!localEnglishFileName || !localFileName) && (
          <LocalFileEditor
            onFilesLoaded={handleFilesLoaded}
            onError={setError}
            localEnglishFileName={localEnglishFileName}
            localFileName={localFileName}
            onEnglishFileUpload={handleEnglishFileUpload}
            onTranslationFileUpload={handleTranslationFileUpload}
          />
        )}
        {Object.keys(groupedEntries).map(section => (
          <div key={section} style={{ marginBottom: '3rem', position: 'relative' }}>
            {section && (
              <h2 style={{
                color: '#888',
                fontSize: isMobile ? '1.1rem' : isMedium ? '1.2rem' : '1.25rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                paddingTop: '0.5rem',
                borderBottom: '1px solid #333',
                position: 'sticky',
                top: isMobile ? '180px' : isMedium ? '150px' : '120px', // Adjust based on header height
                backgroundColor: '#0a0a0a',
                zIndex: 50,
                marginTop: '-0.5rem'
              }}>
                [{section}]
              </h2>
            )}
            {groupedEntries[section].map(entry => (
              <TranslationRow
                key={`${entry.section}-${entry.key}`}
                entry={entry}
                onTranslationChange={handleTranslationChange}
                screenSize={screenSize as 'mobile' | 'medium' | 'desktop'}
              />
            ))}
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;