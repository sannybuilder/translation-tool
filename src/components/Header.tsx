import React from "react";
import sannyLogo from "../assets/sanny.png";
import githubLogo from "../assets/github.svg";
import discordLogo from "../assets/discord.svg";
import { formatLastSaveTime } from "../utils/sessionManager";

type SourceMode = "github" | "local";
type FilterMode = "all" | "untranslated" | "invalid";

interface HeaderProps {
  availableTranslations: string[];
  selectedTranslation: string;
  onTranslationChange: (translation: string) => void;
  onSave: () => void;
  hasChanges: boolean;
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
  lastSaveTime?: number | null;
  isAutoSaving?: boolean;
  hideControls?: boolean;
}

import { useEffect, useRef, useState, useMemo } from "react";

const Header: React.FC<HeaderProps> = ({
  availableTranslations,
  selectedTranslation,
  onTranslationChange,
  onSave,
  hasChanges,
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
  lastSaveTime = null,
  isAutoSaving = false,
  hideControls = false,
}) => {
  // Track whether we've already randomized once
  const didRandomizeRef = useRef(false);
  const [timeTick, setTimeTick] = useState(0);

  // Refresh the "Last saved" label periodically so relative time updates
  useEffect(() => {
    if (!lastSaveTime) return;
    let cancelled = false;
    let timeoutId: number | null = null;

    const schedule = () => {
      if (cancelled) return;
      const diff = Date.now() - lastSaveTime;
      const delay = diff < 60000 ? 10000 : 60000; // 10s for first minute, then 60s
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        setTimeTick(Date.now());
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [lastSaveTime]);

  const lastSavedLabel = useMemo(() => {
    if (!lastSaveTime) return '';
    return formatLastSaveTime(lastSaveTime);
  }, [lastSaveTime, timeTick]);

  useEffect(() => {
  // Skip randomization if an initial lang was provided via query param
    if (suppressRandomize) return;
  // Only randomize once on the very first availability of translations.
  // Randomize only when there's no selection yet (selectedTranslation is empty).
    if (!didRandomizeRef.current && availableTranslations.length > 0 && selectedTranslation === '') {
      const randomLang = availableTranslations[Math.floor(Math.random() * availableTranslations.length)];
      if (randomLang !== selectedTranslation) {
        onTranslationChange(randomLang);
      }
      didRandomizeRef.current = true;
    }
  }, [availableTranslations, suppressRandomize]);

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (hasChanges) {
  //       e.preventDefault();
  //       e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
  //       return "You have unsaved changes. Are you sure you want to leave?";
  //     }
  //   };
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  // }, [hasChanges]);
  return (
    <header id="app-header" style={{ background: '#181818', borderBottom: '1px solid #333', padding: '0 0 8px 0', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Row 1: Logo, Name, Home, Github */}
      <div className="content-width">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="https://sannybuilder.com" target="_blank" rel="noopener noreferrer" title="Sanny Builder homepage" aria-label="Sanny Builder homepage">
            <img src={sannyLogo} alt="Logo" style={{ width: 40, height: 40, marginRight: 8 }} />
          </a>
          <span style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, letterSpacing: 1 }}>Translation Tool</span>
        </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  <a href="https://github.com/sannybuilder/translations" target="_blank" rel="noopener noreferrer" title="View source on GitHub" aria-label="View source on GitHub" style={{ background: '#222', border: 'none', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 500, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 1px 4px #0002' }}>
      <img src={githubLogo} alt="GitHub" style={{ width: 24, height: 24 }} />
  <span className="icon-btn-text">GitHub</span>
    </a>
  <a href="https://sannybuilder.com/discord" target="_blank" rel="noopener noreferrer" title="Join our Discord" aria-label="Join our Discord" style={{ background: '#5865F2', border: 'none', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 500, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 1px 4px #0002' }}>
      <img src={discordLogo} alt="Discord" style={{ width: 24, height: 24 }} />
  <span className="icon-btn-text">Discord</span>
    </a>
  </div>
      </div>
  </div>

  {!hideControls && (
  <div className="content-width">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 32, padding: '4px 0' }}>
        {/* Source Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#aaa', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>Source</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button title="Use GitHub as source" aria-pressed={sourceMode === 'github'} onClick={() => onSourceModeChange('github')} style={{ background: sourceMode === 'github' ? '#4CAF50' : '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px 0 0 4px', padding: '6px 16px', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', marginRight: 0 }}>{isUsingCache ? 'GitHub (cached)' : 'GitHub'}</button>
            <button title="Use local files as source" aria-pressed={sourceMode === 'local'} onClick={() => onSourceModeChange('local')} style={{ background: sourceMode === 'local' ? '#4CAF50' : '#222', color: '#fff', border: '1px solid #444', borderRadius: '0 4px 4px 0', padding: '6px 16px', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', marginLeft: -1 }}>{'Local'}</button>
          </div>
        </div>
        {/* Language selector or upload buttons */}
        {sourceMode === 'github' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label htmlFor="language-selector" className="language-label" style={{ color: '#aaa', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>Language:</label>
            <select id="language-selector" title="Select language file" aria-label="Select language file" value={selectedTranslation} onChange={e => onTranslationChange(e.target.value)} style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '8px 16px', fontSize: '1rem', fontWeight: 500, minWidth: 120 }}>
              {availableTranslations.map(lang => {
                const langName = lang.replace('.ini', '');
                const formattedName = langName.charAt(0).toUpperCase() + langName.slice(1);
                return <option key={lang} value={lang}>{formattedName}</option>;
              })}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <label style={{ color: '#aaa', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>English (Base):</label>
              <input type="file" accept=".ini" onChange={onEnglishFileUpload} style={{ display: 'none' }} id="english-file-input" />
              <label htmlFor="english-file-input" style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '8px 16px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', minWidth: 120 }}>{localEnglishFileName || 'Choose File'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ color: '#aaa', fontWeight: 500, fontSize: '1rem', marginRight: 8 }}>Translation:</label>
              <input type="file" accept=".ini" onChange={onTranslationFileUpload} style={{ display: 'none' }} id="translation-file-input" />
              <label htmlFor="translation-file-input" style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '8px 16px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', minWidth: 120 }}>{localFileName || 'Choose File'}</label>
            </div>
          </div>
        )}
    </div>
  </div>
  )}

    {/* Row 3: Filters left, Save right */}
  {!hideControls && (
  <div className="content-width">
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 0', marginTop: 2 }}>
        {/* Filters */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="filter-btn"
            onClick={() => onFilterChange && onFilterChange('all')}
            style={{
              background: filterMode === 'all' ? '#222' : 'transparent',
              color: '#fff',
              border: filterMode === 'all' ? '1px solid #fff' : '1px solid #444',
              borderRadius: 4,
              padding: '4px 6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
              overflow: 'hidden'
            }}
          >
            <span style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', color: '#fff', flex: '0 1 auto', minWidth: 0, textAlign: 'center' }}>All</span>
            <span style={{ whiteSpace: 'nowrap', flex: '0 0 auto', fontSize: '0.9rem' }}>({totalKeys})</span>
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
              padding: '4px 6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
              overflow: 'hidden'
            }}
          >
            <span style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', color: '#ff9800', flex: '0 1 auto', minWidth: 0, textAlign: 'center' }}>Untranslated</span>
            <span style={{ whiteSpace: 'nowrap', flex: '0 0 auto', color: '#ff9800', fontSize: '0.9rem' }}>({untranslatedKeys})</span>
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
              padding: '4px 6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
              overflow: 'hidden'
            }}
          >
            <span style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', color: '#ff4444', flex: '0 1 auto', minWidth: 0, textAlign: 'center' }}>Invalid</span>
            <span style={{ whiteSpace: 'nowrap', flex: '0 0 auto', color: '#ff4444', fontSize: '0.9rem' }}>({invalidKeys})</span>
          </button>
          <span className="progress-label" style={{ color: '#aaa', fontWeight: 500, fontSize: '1rem', marginLeft: 12 }}>Progress: <span style={{ color: untranslatedKeys === 0 && invalidKeys === 0 ? '#4CAF50' : '#fff', fontWeight: 700 }}>{totalKeys > 0 ? Math.round(((totalKeys - untranslatedKeys) / totalKeys) * 100) : 0}%</span></span>
        </div>
        {/* Save Button with Session Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          {lastSaveTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#aaa', fontSize: '0.9rem' }}>
              <div 
                className={`save-dot ${isAutoSaving ? 'pulsating' : ''}`}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                }}
              />
              <span>Auto saved: {lastSavedLabel}</span>
            </div>
          )}
          <button
            onClick={onSave}
            className="save-btn"
            title={hasChanges ? 'Download (includes your changes)' : 'Download current file'}
            style={{ 
              background: '#4CAF50', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}
          >
            Download
          </button>
        </div>
      </div>
  </div>
  )}
    </header>
  );
};

export default Header;
