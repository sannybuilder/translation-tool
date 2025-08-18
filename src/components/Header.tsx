import React from "react";

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
}

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
}) => {
  // Check screen size for responsive design
  const [screenSize, setScreenSize] = React.useState(() => {
    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "medium";
    if (width <= 1200) return "large";
    return "desktop";
  });

  const isMobile = screenSize === "mobile";
  const isMedium = screenSize === "medium";
  const isLarge = screenSize === "large";
  const isDesktop = screenSize === "desktop";

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setScreenSize("mobile");
      } else if (width <= 1024) {
        setScreenSize("medium");
      } else {
        setScreenSize("desktop");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      style={{
        backgroundColor: "#1a1a1a",
        padding: isMobile ? "1rem" : isMedium ? "1rem 1.5rem" : "1rem 2rem",
        borderBottom: "1px solid #333",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isLarge ? "row" : "column",
          justifyContent: isMobile || isMedium ? "flex-start" : "space-between",
          gap: isMobile || isMedium ? "1rem" : "0",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile || isMedium ? "column" : "row",
            gap: isMobile ? "1rem" : isMedium ? "1.5rem" : "2rem",
            flexWrap: "wrap",
          }}
        >
          {/* Title and GitHub Link */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              flex: "1 1 auto",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            <h1
              style={{
                color: "#fff",
                fontSize: isMobile
                  ? "1.25rem"
                  : isMedium
                  ? "1.35rem"
                  : "1.5rem",
                margin: 0,
              }}
            >
              Sanny Builder Translation Editor
            </h1>
            <a
              href="https://github.com/sannybuilder/translations"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#888",
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span>GitHub: sannybuilder/translations</span>
              <span style={{ fontSize: "0.7rem" }}>↗</span>
            </a>
          </div>

          {/* Source Mode Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              // marginLeft: isMobile || isMedium ? "1rem" : "2rem",
              flexShrink: 0,
            }}
          >
            <label
              style={{
                color: "#aaa",
                fontSize: "0.9rem",
                display: isMobile ? "none" : "block",
              }}
            >
              Source:
            </label>
            <button
              onClick={() => onSourceModeChange("github")}
              style={{
                backgroundColor:
                  sourceMode === "github" ? "#4CAF50" : "#2a2a2a",
                color: "#fff",
                border: "1px solid #444",
                padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                borderRadius: "4px 0 0 4px",
                cursor: "pointer",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                transition: "all 0.3s ease",
              }}
            >
              {isUsingCache ? "GitHub (cached)" : "GitHub"}
            </button>
            <button
              onClick={() => onSourceModeChange("local")}
              style={{
                backgroundColor: sourceMode === "local" ? "#4CAF50" : "#2a2a2a",
                color: "#fff",
                border: "1px solid #444",
                padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                borderRadius: "0 4px 4px 0",
                cursor: "pointer",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                marginLeft: "-1px",
                transition: "all 0.3s ease",
              }}
            >
              {isMobile ? "Local" : "Local Files"}
            </button>

            <button
              onClick={onSave}
              disabled={!hasChanges}
              style={{
                backgroundColor: hasChanges ? "#4CAF50" : "#333",
                color: hasChanges ? "#fff" : "#666",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "4px",
                cursor: hasChanges ? "pointer" : "not-allowed",
                fontSize: "1rem",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                width: isMobile || isMedium ? "100%" : "auto",
                minWidth: isDesktop ? "150px" : "auto",
                maxWidth: "200px",
                alignSelf: isMobile || isMedium ? "stretch" : "center",
              }}
            >
              Save To File
            </button>
          </div>
        </div>
      </div>

      {/* File Selection Controls and Stats */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          // alignItems: isMobile ? "stretch" : "center",
          // justifyContent: "space-between",
          gap: isMobile ? "1rem" : "1.5rem",
          // paddingTop: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile || isMedium ? "stretch" : "center",
            gap: isMobile ? "1rem" : isMedium ? "1.5rem" : "2rem",
            flex: isDesktop ? 1 : "auto",
            // width: isMobile || isMedium ? "100%" : "auto",
          }}
        >
          {sourceMode === "github" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <label htmlFor="language-selector" style={{ color: "#aaa" }}>
                Language:
              </label>
              <select
                id="language-selector"
                value={selectedTranslation}
                onChange={(e) => onTranslationChange(e.target.value)}
                style={{
                  backgroundColor: "#2a2a2a",
                  color: "#fff",
                  border: "1px solid #444",
                  padding: "0.5rem 1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  minWidth: "150px",
                  maxWidth: "150px",
                  flex: isMobile || isMedium ? "1" : "unset",
                }}
              >
                {availableTranslations.map((lang) => {
                  // Format the language name nicely
                  const langName = lang.replace(".ini", "");
                  const formattedName =
                    langName.charAt(0).toUpperCase() + langName.slice(1);
                  return (
                    <option key={lang} value={lang}>
                      {formattedName}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: isMobile || isMedium ? "100%" : "auto",
                  justifyContent: isMobile ? "space-between" : "flex-start",
                }}
              >
                <label
                  style={{
                    color: "#aaa",
                    minWidth: isMobile ? "auto" : "120px",
                  }}
                >
                  English (Base):
                </label>
                <input
                  type="file"
                  accept=".ini"
                  onChange={onEnglishFileUpload}
                  style={{ display: "none" }}
                  id="english-file-input"
                />
                <label
                  htmlFor="english-file-input"
                  style={{
                    backgroundColor: "#2a2a2a",
                    color: "#fff",
                    border: "1px solid #444",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    flex: isMobile || isMedium ? "1" : "unset",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isMobile ? "200px" : "none",
                  }}
                >
                  {localEnglishFileName || "Choose File"}
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: isMobile || isMedium ? "100%" : "auto",
                  justifyContent: isMobile ? "space-between" : "flex-start",
                }}
              >
                <label
                  style={{
                    color: "#aaa",
                    minWidth: isMobile ? "auto" : "120px",
                  }}
                >
                  Translation:
                </label>
                <input
                  type="file"
                  accept=".ini"
                  onChange={onTranslationFileUpload}
                  style={{ display: "none" }}
                  id="translation-file-input"
                />
                <label
                  htmlFor="translation-file-input"
                  style={{
                    backgroundColor: "#2a2a2a",
                    color: "#fff",
                    border: "1px solid #444",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    flex: isMobile || isMedium ? "1" : "unset",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isMobile ? "200px" : "none",
                  }}
                >
                  {localFileName || "Choose File"}
                </label>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            color: "#aaa",
            fontSize: "0.9rem",
            flexWrap: "wrap",
          }}
        >
          <div 
            onClick={() => onFilterChange && onFilterChange('all')}
            title="Click to show all entries"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              cursor: onFilterChange ? "pointer" : "default",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: filterMode === 'all' ? "#1a1a1a" : "transparent",
              border: filterMode === 'all' ? "1px solid #4CAF50" : "1px solid transparent",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (onFilterChange && filterMode !== 'all') {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
              }
            }}
            onMouseLeave={(e) => {
              if (onFilterChange && filterMode !== 'all') {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span>Total:</span>
            <span
              style={{
                color: filterMode === 'all' ? "#4CAF50" : "#fff",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              {totalKeys}
            </span>
          </div>

          {isDesktop && (
            <div
              style={{
                width: "1px",
                height: "20px",
                backgroundColor: "#444",
              }}
            />
          )}

          <div 
            onClick={() => onFilterChange && onFilterChange('untranslated')}
            title="Click to show only untranslated entries"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              cursor: onFilterChange ? "pointer" : "default",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: filterMode === 'untranslated' ? "#1a1a1a" : "transparent",
              border: filterMode === 'untranslated' ? "1px solid #ff9800" : "1px solid transparent",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (onFilterChange && filterMode !== 'untranslated') {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
              }
            }}
            onMouseLeave={(e) => {
              if (onFilterChange && filterMode !== 'untranslated') {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span>Untranslated:</span>
            <span
              style={{
                color: filterMode === 'untranslated' ? "#ff9800" : 
                       untranslatedKeys > 0 ? "#ff9800" : "#4CAF50",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              {untranslatedKeys}
            </span>
          </div>

          {isDesktop && (
            <div
              style={{
                width: "1px",
                height: "20px",
                backgroundColor: "#444",
              }}
            />
          )}

          <div 
            onClick={() => onFilterChange && onFilterChange('invalid')}
            title="Click to show only invalid entries"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              cursor: onFilterChange ? "pointer" : "default",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: filterMode === 'invalid' ? "#1a1a1a" : "transparent",
              border: filterMode === 'invalid' ? "1px solid #ff4444" : "1px solid transparent",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (onFilterChange && filterMode !== 'invalid') {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
              }
            }}
            onMouseLeave={(e) => {
              if (onFilterChange && filterMode !== 'invalid') {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span>Invalid:</span>
            <span
              style={{
                color: filterMode === 'invalid' ? "#ff4444" : 
                       invalidKeys > 0 ? "#ff4444" : "#4CAF50",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              {invalidKeys}
            </span>
          </div>

          {isDesktop && (
            <div
              style={{
                width: "1px",
                height: "20px",
                backgroundColor: "#444",
              }}
            />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Progress:</span>
            <span
              style={{
                color: untranslatedKeys === 0 && invalidKeys === 0 ? "#4CAF50" : "#fff",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              {totalKeys > 0
                ? Math.round(((totalKeys - untranslatedKeys) / totalKeys) * 100)
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
