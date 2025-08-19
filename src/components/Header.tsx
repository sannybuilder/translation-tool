import React from 'react';
import sannyLogo from '../assets/sanny.png';
import githubLogo from '../assets/github.svg';
import discordLogo from '../assets/discord.svg';
import { ChangeTracker } from '../utils/changeTracker';

type SourceMode = 'github' | 'local';
type FilterMode = 'all' | 'untranslated' | 'invalid';

interface HeaderProps {
  availableTranslations: string[];
  selectedTranslation: string;
  onTranslationChange: (translation: string) => void;
  totalKeys: number;
  untranslatedKeys: number;
  invalidKeys?: number;
  filterMode?: FilterMode;
  onFilterChange?: (mode: FilterMode) => void;
  sourceMode: SourceMode;
  onSourceModeChange: (mode: SourceMode) => void;
  localFileName: string;
  localEnglishFileName: string;
  onEnglishFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTranslationFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUsingCache?: boolean;
  suppressRandomize?: boolean;
  hideControls?: boolean;
  screenSize?: 'mobile' | 'medium' | 'desktop';
  pendingChanges?: number;
  onReviewChangesClick?: () => void;
  changeTracker?: ChangeTracker | null; // For checking pending changes language
}

import { useEffect, useRef } from 'react';

const Header: React.FC<HeaderProps> = ({
  availableTranslations,
  selectedTranslation,
  onTranslationChange,
  totalKeys,
  untranslatedKeys,
  invalidKeys = 0,
  filterMode = 'all',
  onFilterChange,
  sourceMode,
  onSourceModeChange,
  localFileName,
  localEnglishFileName,
  onEnglishFileUpload,
  onTranslationFileUpload,
  isUsingCache = false,
  suppressRandomize = false,
  hideControls = false,
  screenSize = 'desktop',
  pendingChanges = 0,
  onReviewChangesClick,
  changeTracker,
}) => {
  // Track whether we've already randomized once
  const didRandomizeRef = useRef(false);

  useEffect(() => {
    // Skip randomization if an initial lang was provided via query param
    if (suppressRandomize) return;
    // Only randomize once on the very first availability of translations.
    // Randomize only when there's no selection yet (selectedTranslation is empty).
    if (!didRandomizeRef.current && availableTranslations.length > 0 && selectedTranslation === '') {
      // Check if there are pending changes with a language preference
      let langToSelect = null;
      
      // First, check for pending changes language (this takes priority)
      const pendingChangesLanguage = ChangeTracker.getPendingChangesLanguage();
      if (pendingChangesLanguage && availableTranslations.includes(pendingChangesLanguage)) {
        langToSelect = pendingChangesLanguage;
      }
      
      // If no pending changes language, check for saved session
      if (!langToSelect && changeTracker) {
        try {
          const savedSession = localStorage.getItem('translation_session');
          if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            if (sessionData.selectedTranslation && availableTranslations.includes(sessionData.selectedTranslation)) {
              langToSelect = sessionData.selectedTranslation;
            }
          }
                    } catch {
          // Fall back to random selection if we can't get the language
        }
      }
      
      // If no language from pending changes or session, pick random
      if (!langToSelect || !availableTranslations.includes(langToSelect)) {
        langToSelect = availableTranslations[Math.floor(Math.random() * availableTranslations.length)];
      }
      
      if (langToSelect !== selectedTranslation) {
        onTranslationChange(langToSelect);
      }
      didRandomizeRef.current = true;
    }
  }, [availableTranslations, suppressRandomize, changeTracker, selectedTranslation, onTranslationChange]);

  const isMobile = screenSize === 'mobile';

  return (
    <header
      id="app-header"
      style={{
        background: '#181818',
        borderBottom: '1px solid #333',
        padding: '0 0 8px 0',
      }}
    >
      {/* Row 1: Logo, Name, Home, Github */}
      <div className="content-width">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 8px 6px 0' : '16px 0px 8px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <a
              href="https://sannybuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Sanny Builder homepage"
              aria-label="Sanny Builder homepage"
            >
              <img src={sannyLogo} alt="Logo" style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, marginRight: isMobile ? 4 : 8 }} />
            </a>
            <span
              style={{
                color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1.15rem',
                fontWeight: 700,
                letterSpacing: isMobile ? 0 : 1,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0',
              }}
            >
              <span>Translation</span>
              <span style={{ marginLeft: isMobile ? '4px' : '8px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                Tool
                <span
                  style={{
                    fontSize: isMobile ? '0.55rem' : '0.65rem',
                    fontWeight: 600,
                    color: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.15)',
                    padding: isMobile ? '1px 4px' : '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    letterSpacing: '0.5px',
                    marginLeft: isMobile ? '4px' : '8px',
                  }}
                >
                  BETA
                </span>
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
            <a
              href="https://github.com/sannybuilder/translation-tool"
              target="_blank"
              rel="noopener noreferrer"
              title="View source on GitHub"
              aria-label="View source on GitHub"
              style={{
                background: '#222',
                border: 'none',
                borderRadius: 6,
                padding: isMobile ? '6px' : '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0 : 8,
                color: '#fff',
                fontWeight: 500,
                fontSize: isMobile ? '0.9rem' : '1rem',
                textDecoration: 'none',
                boxShadow: '0 1px 4px #0002',
              }}
            >
              <img src={githubLogo} alt="GitHub" style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />
              {!isMobile && <span className="icon-btn-text">GitHub</span>}
            </a>
            <a
              href="https://sannybuilder.com/discord"
              target="_blank"
              rel="noopener noreferrer"
              title="Join our Discord"
              aria-label="Join our Discord"
              style={{
                background: '#5865F2',
                border: 'none',
                borderRadius: 6,
                padding: isMobile ? '6px' : '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0 : 8,
                color: '#fff',
                fontWeight: 500,
                fontSize: isMobile ? '0.9rem' : '1rem',
                textDecoration: 'none',
                boxShadow: '0 1px 4px #0002',
              }}
            >
              <img src={discordLogo} alt="Discord" style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />
              {!isMobile && <span className="icon-btn-text">Discord</span>}
            </a>
          </div>
        </div>
      </div>

      {!hideControls && (
        <div className="content-width">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: isMobile ? 8 : 32,
              padding: isMobile ? '2px 0' : '4px 0',
              flexWrap: isMobile && sourceMode === 'local' ? 'wrap' : 'nowrap',
            }}
          >
            {/* Source Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
              <span
                style={{
                  color: '#aaa',
                  fontWeight: 500,
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  marginRight: isMobile ? 4 : 8,
                }}
              >
                {isMobile ? 'Src' : 'Source'}
              </span>
              {isMobile ? (
                <select
                  value={sourceMode}
                  onChange={(e) => onSourceModeChange(e.target.value as SourceMode)}
                  style={{
                    background: '#222',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    fontWeight: 500,
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="github">{isUsingCache ? 'GitHub (cached)' : 'GitHub'}</option>
                  <option value="local">Local</option>
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    title="Use GitHub as source"
                    aria-pressed={sourceMode === 'github'}
                    onClick={() => onSourceModeChange('github')}
                    style={{
                      background: sourceMode === 'github' ? '#4CAF50' : '#222',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '4px 0 0 4px',
                      padding: '6px 16px',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      marginRight: 0,
                    }}
                  >
                    {isUsingCache ? 'GitHub (cached)' : 'GitHub'}
                  </button>
                  <button
                    title="Use local files as source"
                    aria-pressed={sourceMode === 'local'}
                    onClick={() => onSourceModeChange('local')}
                    style={{
                      background: sourceMode === 'local' ? '#4CAF50' : '#222',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '0 4px 4px 0',
                      padding: '6px 16px',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      marginLeft: -1,
                    }}
                  >
                    {'Local'}
                  </button>
                </div>
              )}
            </div>
            {/* Language selector or upload buttons */}
            {sourceMode === 'github' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12 }}>
                <label
                  htmlFor="language-selector"
                  className="language-label"
                  style={{
                    color: '#aaa',
                    fontWeight: 500,
                    fontSize: isMobile ? '0.85rem' : '1rem',
                    marginRight: isMobile ? 4 : 8,
                  }}
                >
                  {isMobile ? 'Lang:' : 'Language:'}
                </label>
                <select
                  id="language-selector"
                  title="Select language file"
                  aria-label="Select language file"
                  value={selectedTranslation}
                  onChange={(e) => onTranslationChange(e.target.value)}
                  style={{
                    background: '#222',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: isMobile ? '4px 8px' : '8px 16px',
                    fontSize: isMobile ? '0.85rem' : '1rem',
                    fontWeight: 500,
                    minWidth: isMobile ? 80 : 120,
                  }}
                >
                  {availableTranslations.map((lang) => {
                    const langName = lang.replace('.ini', '');
                    const formattedName = langName.charAt(0).toUpperCase() + langName.slice(1);
                    return (
                      <option key={lang} value={lang}>
                        {formattedName}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flex: isMobile ? 1 : 'initial' }}>
                <label
                  style={{
                    color: '#aaa',
                    fontWeight: 500,
                    fontSize: isMobile ? '0.85rem' : '1rem',
                  }}
                >
                  {isMobile ? 'EN:' : 'English (Base):'}
                </label>
                <input
                  type="file"
                  accept=".ini"
                  onChange={onEnglishFileUpload}
                  style={{ display: 'none' }}
                  id="english-file-input"
                />
                <label
                  htmlFor="english-file-input"
                  style={{
                    background: '#222',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: 6,
                    padding: isMobile ? '4px 8px' : '8px 16px',
                    fontSize: isMobile ? '0.85rem' : '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    minWidth: isMobile ? 70 : 120,
                    maxWidth: isMobile ? 100 : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isMobile && localEnglishFileName ? '✓' + localEnglishFileName.substring(0, 8) : (localEnglishFileName || 'Choose File')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flex: isMobile ? 1 : 'initial' }}>
                  <label
                    style={{
                      color: '#aaa',
                      fontWeight: 500,
                      fontSize: isMobile ? '0.85rem' : '1rem',
                    }}
                  >
                    {isMobile ? 'TR:' : 'Translation:'}
                  </label>
                  <input
                    type="file"
                    accept=".ini"
                    onChange={onTranslationFileUpload}
                    style={{ display: 'none' }}
                    id="translation-file-input"
                  />
                  <label
                    htmlFor="translation-file-input"
                    style={{
                      background: '#222',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: 6,
                      padding: isMobile ? '4px 8px' : '8px 16px',
                      fontSize: isMobile ? '0.85rem' : '1rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      minWidth: isMobile ? 70 : 120,
                      maxWidth: isMobile ? 100 : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isMobile && localFileName ? '✓' + localFileName.substring(0, 8) : (localFileName || 'Choose File')}
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 3: Filters left, Review Changes right */}
      {!hideControls && selectedTranslation && (
        <div className="content-width">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 0 0',
              marginTop: 2,
            }}
          >
            {/* Filters and Desktop Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
              <button
                className="filter-btn"
                onClick={() => onFilterChange && onFilterChange('all')}
                style={{
                  background: filterMode === 'all' ? '#222' : 'transparent',
                  color: '#fff',
                  border: filterMode === 'all' ? '1px solid #fff' : '1px solid #444',
                  borderRadius: 4,
                  padding: isMobile ? '3px 5px' : '4px 6px',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  flexWrap: 'wrap',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    color: '#fff',
                    flex: '0 1 auto',
                    minWidth: 0,
                    textAlign: 'center',
                  }}
                >
                  {!isMobile && 'All'}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                  }}
                >
                  {isMobile ? totalKeys : `(${totalKeys})`}
                </span>
              </button>
              <button
                className="filter-btn"
                onClick={() => onFilterChange && onFilterChange('untranslated')}
                title={`Untranslated (${untranslatedKeys})`}
                style={{
                  background: filterMode === 'untranslated' ? '#222' : 'transparent',
                  color: '#ff9800',
                  border: filterMode === 'untranslated' ? '1px solid #ff9800' : '1px solid #444',
                  borderRadius: 4,
                  padding: isMobile ? '3px 5px' : '4px 6px',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  flexWrap: 'wrap',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    color: '#ff9800',
                    flex: '0 1 auto',
                    minWidth: 0,
                    textAlign: 'center',
                  }}
                >
                  {isMobile ? '🔍' : 'Untranslated'}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    color: '#ff9800',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                  }}
                >
                  {isMobile ? untranslatedKeys : `(${untranslatedKeys})`}
                </span>
              </button>
              <button
                className="filter-btn"
                onClick={() => onFilterChange && onFilterChange('invalid')}
                title={`Invalid (${invalidKeys})`}
                style={{
                  background: filterMode === 'invalid' ? '#222' : 'transparent',
                  color: '#ff4444',
                  border: filterMode === 'invalid' ? '1px solid #ff4444' : '1px solid #444',
                  borderRadius: 4,
                  padding: isMobile ? '3px 5px' : '4px 6px',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  flexWrap: 'wrap',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    color: '#ff4444',
                    flex: '0 1 auto',
                    minWidth: 0,
                    textAlign: 'center',
                  }}
                >
                  {isMobile ? '⚠️' : 'Invalid'}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    color: '#ff4444',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                  }}
                >
                  {isMobile ? invalidKeys : `(${invalidKeys})`}
                </span>
              </button>
              {/* Progress display for all screen sizes */}
              <span
                className="progress-label"
                style={{
                  color: '#aaa',
                  fontWeight: 500,
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  marginLeft: isMobile ? 8 : 12,
                }}
              >
                {!isMobile && 'Progress:'}{' '}
                <span
                  style={{
                    color: (() => {
                      const progressPercent = totalKeys > 0 ? Math.round(((totalKeys - untranslatedKeys) / totalKeys) * 100) : 0;
                      if (progressPercent === 100 && invalidKeys === 0) return '#4CAF50'; // Green for complete
                      if (progressPercent >= 80) return '#8BC34A'; // Light green for 80%+
                      if (progressPercent >= 60) return '#FFEB3B'; // Yellow for 60%+
                      if (progressPercent >= 40) return '#FF9800'; // Orange for 40%+
                      if (progressPercent >= 20) return '#FF5722'; // Deep orange for 20%+
                      return '#F44336'; // Red for < 20%
                    })(),
                    fontWeight: 700,
                    fontSize: isMobile ? '0.85rem' : 'inherit',
                  }}
                >
                  {totalKeys > 0 ? Math.round(((totalKeys - untranslatedKeys) / totalKeys) * 100) : 0}%
                </span>
              </span>
            </div>
            
            {/* Review Changes Button */}
            {pendingChanges > 0 && onReviewChangesClick && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '4px' : '12px',
                }}
              >
                <button
                  onClick={onReviewChangesClick}
                  className="review-changes-btn"
                  title={`Review ${pendingChanges} pending changes`}
                  style={{
                    background: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    padding: isMobile ? '4px 8px' : '8px 16px',
                    borderRadius: '4px',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isMobile ? 'Review' : 'Review Changes'}
                  <span
                    style={{
                      backgroundColor: '#fff',
                      color: '#4CAF50',
                      borderRadius: '12px',
                      padding: isMobile ? '1px 6px' : '2px 8px',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      fontWeight: 'bold',
                      minWidth: isMobile ? '20px' : '24px',
                      textAlign: 'center',
                    }}
                  >
                    {pendingChanges}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
