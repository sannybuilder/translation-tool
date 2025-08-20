import React, { useEffect, useRef } from 'react';
import sannyLogo from '../assets/sanny.png';
import githubLogo from '../assets/github.svg';
import discordLogo from '../assets/discord.svg';
import Button from './ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../styles/theme';
import { useScreenSize } from '../hooks/useScreenSize';
import { combineStyles } from '../styles/styles';

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
  pendingChanges?: number;
  onReviewChangesClick?: () => void;
  hasActiveCache?: boolean;
}

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
  pendingChanges = 0,
  onReviewChangesClick,
  hasActiveCache = false,
}) => {
  const { isMobile } = useScreenSize();
  const didRandomizeRef = useRef(false);

  useEffect(() => {
    if (suppressRandomize) return;
    if (!didRandomizeRef.current && availableTranslations.length > 0 && selectedTranslation === '') {
      const langToSelect = availableTranslations[Math.floor(Math.random() * availableTranslations.length)];
      if (langToSelect !== selectedTranslation) {
        onTranslationChange(langToSelect);
      }
      didRandomizeRef.current = true;
    }
  }, [availableTranslations, suppressRandomize, selectedTranslation, onTranslationChange]);

  const getProgressColor = (percent: number): string => {
    if (percent === 100 && invalidKeys === 0) return colors.success;
    if (percent >= 80) return '#8BC34A';
    if (percent >= 60) return '#FFEB3B';
    if (percent >= 40) return colors.warning;
    if (percent >= 20) return '#FF5722';
    return colors.error;
  };

  const progressPercent = totalKeys > 0 ? Math.round(((totalKeys - untranslatedKeys) / totalKeys) * 100) : 0;

  const headerStyles = {
    container: {
      background: colors.bgDark,
      borderBottom: `1px solid ${colors.borderPrimary}`,
      padding: '0 0 8px 0',
    },
    contentWidth: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: `0 ${isMobile ? spacing.sm : spacing.lg}`,
    },
    topRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '12px 8px 6px 0' : '16px 0px 8px 0',
    },
    logo: {
      width: isMobile ? 32 : 40,
      height: isMobile ? 32 : 40,
      marginRight: isMobile ? 4 : 8,
    },
    title: {
      color: colors.textPrimary,
      fontSize: isMobile ? fontSize.lg : fontSize.xxl,
      fontWeight: 700,
      letterSpacing: isMobile ? 0 : 1,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
      gap: '0',
    },
    betaBadge: {
      fontSize: isMobile ? '0.55rem' : '0.65rem',
      fontWeight: 600,
      color: colors.success,
      backgroundColor: colors.primaryLight,
      padding: isMobile ? '1px 4px' : '2px 6px',
      borderRadius: borderRadius.md,
      border: `1px solid rgba(76, 175, 80, 0.3)`,
      letterSpacing: '0.5px',
      marginLeft: isMobile ? '4px' : '8px',
    },
    controlsRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: isMobile ? 8 : 32,
      padding: isMobile ? '2px 0' : '4px 0',
      flexWrap: (isMobile && sourceMode === 'local' ? 'wrap' : 'nowrap') as 'wrap' | 'nowrap',
    },
    filterButton: {
      background: 'transparent',
      border: `1px solid ${colors.borderSecondary}`,
      borderRadius: borderRadius.md,
      padding: isMobile ? '3px 5px' : '4px 6px',
      fontSize: isMobile ? fontSize.sm : fontSize.base,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      flexWrap: 'wrap' as const,
      overflow: 'hidden',
    },
  };

  return (
    <header id="app-header" style={headerStyles.container}>
      <div className="content-width" style={headerStyles.contentWidth}>
        <div style={headerStyles.topRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <a
              href="https://sannybuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Sanny Builder homepage"
              aria-label="Sanny Builder homepage"
            >
              <img src={sannyLogo} alt="Logo" style={headerStyles.logo} />
            </a>
            <span style={headerStyles.title}>
              <span>Translation</span>
              <span style={{ marginLeft: isMobile ? '4px' : '8px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                Tool
                <span style={headerStyles.betaBadge}>BETA</span>
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
            <Button
              variant="secondary"
              size={isMobile ? 'small' : 'medium'}
              icon={<img src={githubLogo} alt="GitHub" style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />}
              onClick={() => window.open('https://github.com/sannybuilder/translation-tool', '_blank')}
              title="View source on GitHub"
              aria-label="View source on GitHub"
            >
              {!isMobile && 'GitHub'}
            </Button>
            <Button
              variant="primary"
              size={isMobile ? 'small' : 'medium'}
              icon={<img src={discordLogo} alt="Discord" style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />}
              onClick={() => window.open('https://sannybuilder.com/discord', '_blank')}
              title="Join our Discord"
              aria-label="Join our Discord"
              customStyle={{ backgroundColor: colors.discord }}
            >
              {!isMobile && 'Discord'}
            </Button>
          </div>
        </div>
      </div>

      {!hideControls && (
        <div className="content-width" style={headerStyles.contentWidth}>
          <div style={headerStyles.controlsRow}>
            {/* Source Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
              <span style={{ color: colors.textSecondary, fontWeight: 500, fontSize: isMobile ? fontSize.md : fontSize.xl, marginRight: isMobile ? 4 : 8 }}>
                {isMobile ? 'Src' : 'Source'}
              </span>
              {isMobile ? (
                <select
                  value={sourceMode}
                  onChange={(e) => onSourceModeChange(e.target.value as SourceMode)}
                  style={{
                    background: colors.github,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderSecondary}`,
                    borderRadius: borderRadius.md,
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    fontWeight: 500,
                    fontSize: isMobile ? fontSize.md : fontSize.lg,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="github">{isUsingCache ? 'GitHub (cached)' : 'GitHub'}</option>
                  <option value="local">Local</option>
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant={sourceMode === 'github' ? 'primary' : 'secondary'}
                    size="medium"
                    onClick={() => onSourceModeChange('github')}
                    title="Use GitHub as source"
                    aria-pressed={sourceMode === 'github'}
                    customStyle={{
                      borderRadius: '4px 0 0 4px',
                      marginRight: -1,
                    }}
                  >
                    {isUsingCache ? 'GitHub (cached)' : 'GitHub'}
                  </Button>
                  <Button
                    variant={sourceMode === 'local' ? 'primary' : 'secondary'}
                    size="medium"
                    onClick={() => onSourceModeChange('local')}
                    title="Use local files as source"
                    aria-pressed={sourceMode === 'local'}
                    customStyle={{
                      borderRadius: '0 4px 4px 0',
                    }}
                  >
                    Local
                  </Button>
                </div>
              )}
            </div>

            {/* Language selector or upload buttons */}
            {sourceMode === 'github' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12 }}>
                <label htmlFor="language-selector" style={{ color: colors.textSecondary, fontWeight: 500, fontSize: isMobile ? fontSize.md : fontSize.xl, marginRight: isMobile ? 4 : 8 }}>
                  {isMobile ? 'Lang:' : 'Language:'}
                </label>
                <select
                  id="language-selector"
                  title="Select language file"
                  aria-label="Select language file"
                  value={selectedTranslation}
                  onChange={(e) => onTranslationChange(e.target.value)}
                  style={{
                    background: colors.github,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderSecondary}`,
                    borderRadius: borderRadius.lg,
                    padding: isMobile ? '4px 8px' : '8px 16px',
                    fontSize: isMobile ? fontSize.md : fontSize.xl,
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
                <label style={{ color: colors.textSecondary, fontWeight: 500, fontSize: isMobile ? fontSize.md : fontSize.xl }}>
                  {isMobile ? 'EN:' : 'English (Base):'}
                </label>
                <input type="file" accept=".ini" onChange={onEnglishFileUpload} style={{ display: 'none' }} id="english-file-input" />
                <label
                  htmlFor="english-file-input"
                  style={{
                    background: colors.github,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.borderSecondary}`,
                    borderRadius: borderRadius.lg,
                    padding: isMobile ? '4px 8px' : '8px 16px',
                    fontSize: isMobile ? fontSize.md : fontSize.xl,
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
                  <label style={{ color: colors.textSecondary, fontWeight: 500, fontSize: isMobile ? fontSize.md : fontSize.xl }}>
                    {isMobile ? 'TR:' : 'Translation:'}
                  </label>
                  <input type="file" accept=".ini" onChange={onTranslationFileUpload} style={{ display: 'none' }} id="translation-file-input" />
                  <label
                    htmlFor="translation-file-input"
                    style={{
                      background: colors.github,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderSecondary}`,
                      borderRadius: borderRadius.lg,
                      padding: isMobile ? '4px 8px' : '8px 16px',
                      fontSize: isMobile ? fontSize.md : fontSize.xl,
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

      {/* Filters and Progress */}
      {!hideControls && selectedTranslation && (
        <div className="content-width" style={headerStyles.contentWidth}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 0', marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
              {/* Filter Buttons */}
              <button
                className="filter-btn"
                onClick={() => onFilterChange && onFilterChange('all')}
                style={combineStyles(
                  headerStyles.filterButton,
                  filterMode === 'all' ? { background: colors.github, border: `1px solid ${colors.textPrimary}` } : {}
                )}
              >
                <span style={{ color: colors.textPrimary }}>{!isMobile && 'All'}</span>
                <span style={{ fontWeight: 700, color: colors.textPrimary }}>{isMobile ? totalKeys : `(${totalKeys})`}</span>
              </button>
              <button
                className="filter-btn"
                onClick={() => onFilterChange && onFilterChange('untranslated')}
                title={`Untranslated (${untranslatedKeys})`}
                style={combineStyles(
                  headerStyles.filterButton,
                  { color: colors.warning },
                  filterMode === 'untranslated' ? { background: colors.github, border: `1px solid ${colors.warning}` } : {}
                )}
              >
                <span>{isMobile ? '🔍' : 'Untranslated'}</span>
                <span style={{ fontWeight: 700 }}>{isMobile ? untranslatedKeys : `(${untranslatedKeys})`}</span>
              </button>
              <button
                className="filter-btn"
                onClick={() => onFilterChange && onFilterChange('invalid')}
                title={`Invalid (${invalidKeys})`}
                style={combineStyles(
                  headerStyles.filterButton,
                  { color: colors.error },
                  filterMode === 'invalid' ? { background: colors.github, border: `1px solid ${colors.error}` } : {}
                )}
              >
                <span>{isMobile ? '⚠️' : 'Invalid'}</span>
                <span style={{ fontWeight: 700 }}>{isMobile ? invalidKeys : `(${invalidKeys})`}</span>
              </button>

              {/* Progress display */}
              <span style={{ color: colors.textSecondary, fontWeight: 500, fontSize: isMobile ? fontSize.md : fontSize.xl, marginLeft: isMobile ? 8 : 12 }}>
                {!isMobile && 'Progress:'}{' '}
                <span style={{ color: getProgressColor(progressPercent), fontWeight: 700, fontSize: isMobile ? fontSize.md : 'inherit' }}>
                  {progressPercent}%
                </span>
              </span>
            </div>

            {/* Review Changes Button */}
            {hasActiveCache && onReviewChangesClick && (
              <Button
                variant="primary"
                size={isMobile ? 'small' : 'medium'}
                onClick={onReviewChangesClick}
                data-testid="review-changes-btn"
                title={pendingChanges > 0 ? `Review ${pendingChanges} pending changes` : 'Review changes and download full file'}
              >
                {isMobile ? 'Review' : 'Review Changes'}
                {pendingChanges > 0 && (
                  <span
                    style={{
                      backgroundColor: colors.textPrimary,
                      color: colors.primary,
                      borderRadius: '12px',
                      padding: isMobile ? '1px 6px' : '2px 8px',
                      fontSize: isMobile ? fontSize.xs : fontSize.md,
                      fontWeight: 'bold',
                      minWidth: isMobile ? '20px' : '24px',
                      textAlign: 'center',
                      marginLeft: isMobile ? '4px' : '8px',
                    }}
                  >
                    {pendingChanges}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;