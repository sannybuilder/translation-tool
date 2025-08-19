import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import LocalFileEditor from "./components/LocalFileEditor";
import StatusBanner from "./components/StatusBanner";
import GitHubErrorView from "./components/GitHubErrorView";
import TranslationSections from "./components/TranslationSections";
import ModeChangeDialog from "./components/ModeChangeDialog";
import SessionResumeBanner from "./components/SessionResumeBanner";
import { parseIni, serializeIni, countFormatSpecifiers } from "./utils/iniParser";
import type { IniData } from "./utils/iniParser";
import type { TranslationEntry } from "./types/translation";
import type { SessionData, SessionState } from "./types/session";
import {
  getCachedData,
  setCachedData,
  fetchGitHubFileList,
  fetchTranslationFile,
  fetchGitHubFileNamesOnly,
  readLocalFile,
} from "./utils/githubCache";
import {
  saveSession,
  loadSession,
  clearSession,
  getAutosaveInterval,
} from "./utils/sessionManager";
import "./App.css";

type SourceMode = "github" | "local";
type FilterMode = "all" | "untranslated" | "invalid";

function App() {
  const [englishData, setEnglishData] = useState<IniData>({});
  const [translationData, setTranslationData] = useState<IniData>({});
  const [originalTranslationData, setOriginalTranslationData] = useState<IniData>({});
  const [selectedTranslation, setSelectedTranslation] = useState<string>("");
  const [availableTranslations, setAvailableTranslations] = useState<string[]>([]);
  // const [initialLangId, setInitialLangId] = useState<string | null>(null);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({ total: 0, untranslated: 0, invalid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("github");
  const [localFileName, setLocalFileName] = useState<string>("");
  const [localEnglishFileName, setLocalEnglishFileName] = useState<string>("");
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [githubInitiallyFailed, setGithubInitiallyFailed] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showModeChangeConfirm, setShowModeChangeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<SourceMode | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasSavedThisRun, setHasSavedThisRun] = useState(false);

  // Session management state
  const [sessionState, setSessionState] = useState<SessionState>({
    hasSession: false,
    lastSaveTime: null,
    isAutoSaving: false,
    showResumePrompt: false,
  });
  const [initialSessionData, setInitialSessionData] = useState<SessionData | null>(null);
  // Deprecated: kept to avoid large refactors; no longer used after switching to debounced save
  // const autoSaveIntervalRef = useRef<number | null>(null);
  const debouncedSaveTimeoutRef = useRef<number | null>(null);
  const userEditedRef = useRef<boolean>(false);

  // Check screen size for responsive design
  const [screenSize, setScreenSize] = useState(() => {
    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "medium";
    return "desktop";
  });

  const isMobile = screenSize === "mobile";
  const isMedium = screenSize === "medium";

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 768) setScreenSize("mobile");
      else if (width <= 1024) setScreenSize("medium");
      else setScreenSize("desktop");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const existingSession = loadSession();
    if (existingSession) {
      setSessionState(prev => ({
        ...prev,
        hasSession: true,
        showResumePrompt: true,
        lastSaveTime: existingSession.timestamp,
      }));
      setInitialSessionData(existingSession);
      // Prevent any loading spinners while waiting for user choice
      setLoading(false);
    }
    // Gate: mark that we've completed the session check (whether we found a session or not)
    setHasCheckedSession(true);
  }, []);

  // Keep a CSS variable with the header height so section headings can stick below it
  useEffect(() => {
    const setHeaderHeightVar = () => {
      const header = document.getElementById("app-header");
      const height = header ? header.getBoundingClientRect().height : 0;
      const effective = Math.max(Math.ceil(height), 168);
      document.documentElement.style.setProperty("--header-height", `${effective}px`);
    };

    setHeaderHeightVar();
    window.addEventListener("resize", setHeaderHeightVar);
    // Also observe mutations in case header content changes (fonts, content)
    const obs = new MutationObserver(() => setHeaderHeightVar());
    const headerEl = document.getElementById("app-header");
    if (headerEl) obs.observe(headerEl, { childList: true, subtree: true, characterData: true });

    return () => {
      window.removeEventListener("resize", setHeaderHeightVar);
      obs.disconnect();
    };
  }, []);

  // Handle local English file upload
  const handleEnglishFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const content = await readLocalFile(file);
      const parsed = parseIni(content);
      handleFilesLoaded(parsed, {}, file.name, "");
    } catch (err) {
      console.error("Error loading local English file:", err);
      setError("Failed to load English file");
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
      handleFilesLoaded({}, parsed, "", file.name);
    } catch (err) {
      console.error("Error loading local translation file:", err);
      setError("Failed to load translation file");
    }
  };

  // Handle files loaded via drag and drop
  const handleFilesLoaded = (
    englishData: IniData,
    translationData: IniData,
    englishFileName: string,
    translationFileName: string
  ) => {
    // Update English data if provided
    if (Object.keys(englishData).length > 0) {
      setEnglishData(englishData);
    }

    // Update translation data if provided
    if (Object.keys(translationData).length > 0) {
      setTranslationData(translationData);
      setOriginalTranslationData(JSON.parse(JSON.stringify(translationData)));
    }

    // Update filenames if provided
    if (englishFileName) {
      setLocalEnglishFileName(englishFileName);
    }
    if (translationFileName) {
      setLocalFileName(translationFileName);
    }

    setHasChanges(false);
    setError(null);
  };

  // Fetch available translations from GitHub
  useEffect(() => {
    // Early exits - don't do any GitHub loading in these cases
    if (!hasCheckedSession) {
      return;
    }
    if (sourceMode === "local") {
      setLoading(false);
      return;
    }

    if (sessionState.showResumePrompt) {
      setLoading(false);
      return;
    }

    // If we get here, we should load from GitHub
    const fetchAvailableTranslations = async () => {
      setLoading(true);
      setError(null);

      // After initial load, always use cache when switching between modes
      if (hasInitiallyLoaded) {
        const cachedFileList = getCachedData<string[]>("github_file_list");
        const cachedEnglishData = getCachedData<IniData>("english_ini");

        if (cachedFileList && cachedEnglishData) {
          console.log("Using cached data (mode switch after initial load)");
          // Only set isUsingCache if GitHub initially failed
          // This ensures the "cached" label only appears when GitHub was unavailable
          if (githubInitiallyFailed) {
            setIsUsingCache(true);
            setError("GitHub unavailable. Using cached data.");
          }
          setAvailableTranslations(cachedFileList);
          setEnglishData(cachedEnglishData);

          // Set default selection to the first available translation
          if (cachedFileList.length > 0) {
            // Only set a default if nothing is selected yet
            setSelectedTranslation((prev) => prev || cachedFileList[0]);
          }

          setLoading(false);
          return;
        }
      }

      // Initial load or no cache available - try to fetch fresh data
      try {
        console.log("Attempting to fetch fresh data from GitHub");

        // Try to fetch from GitHub first
        const { files: iniFiles, englishData } = await fetchGitHubFileList();

        // Success! Update cache with fresh data
        console.log("Successfully fetched fresh data from GitHub");
        setCachedData("github_file_list", iniFiles);
        setCachedData("english_ini", englishData);

        setIsUsingCache(false);
        setGithubInitiallyFailed(false); // GitHub succeeded
        setAvailableTranslations(iniFiles);
        setEnglishData(englishData);
        setHasInitiallyLoaded(true);

        // Set default selection to a random available translation (only if nothing selected yet)
        if (iniFiles.length > 0) {
          const randomLang = iniFiles[Math.floor(Math.random() * iniFiles.length)];
          setSelectedTranslation((prev) => prev || randomLang);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching from GitHub, attempting to use cache:", err);

        // GitHub failed, try to load from cache
        const cachedFileList = getCachedData<string[]>("github_file_list");
        const cachedEnglishData = getCachedData<IniData>("english_ini");

        if (cachedFileList && cachedEnglishData) {
          console.log("Using cached data (GitHub unavailable)");
          setIsUsingCache(true);
          setGithubInitiallyFailed(true); // Track that GitHub initially failed
          setAvailableTranslations(cachedFileList);
          setEnglishData(cachedEnglishData);
          setHasInitiallyLoaded(true);

          // Set default selection to the first available translation
          if (cachedFileList.length > 0) {
            // Only set a default if nothing is selected yet
            setSelectedTranslation((prev) => prev || cachedFileList[0]);
          }

          // Show a message that we're using cached data
          const errorMessage = "GitHub unavailable. Using cached data.";
          setError(errorMessage);
          setLoading(false);
        } else {
          // No cache available, show error
          const errorMessage =
            err instanceof Error
              ? `${err.message} Please try again or use local files.`
              : "Failed to load translations from GitHub. Please try again or use local files.";
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    // Only call the function if we haven't returned early
    fetchAvailableTranslations();
  }, [sourceMode, hasInitiallyLoaded, githubInitiallyFailed, sessionState.showResumePrompt, hasCheckedSession]);

  // Load selected translation from GitHub
  useEffect(() => {
    if (!hasCheckedSession) return;
    if (selectedTranslation && sourceMode === "github" && !sessionState.showResumePrompt) {
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
            const errorMessage = "GitHub unavailable. Using cached data.";
            setError(errorMessage);
          } else {
            // No cache available, show error
            const errorMessage =
              error instanceof Error
                ? `${error.message} Please try again or switch to local files.`
                : `Failed to load ${selectedTranslation}. Please try again or switch to local files.`;
            setError(errorMessage);
          }
        }
      };

      loadTranslation();
    }
  }, [selectedTranslation, sourceMode, hasInitiallyLoaded, sessionState.showResumePrompt, hasCheckedSession]);

  // Process entries when data changes
  useEffect(() => {
    const processedEntries: TranslationEntry[] = [];
    let untranslatedCount = 0;
    let invalidCount = 0;

    Object.keys(englishData).forEach((section) => {
      // Skip the root section (empty string) which contains LANGID
      if (section === "") return;

      Object.keys(englishData[section]).forEach((key) => {
        const englishText = englishData[section][key];
        const translatedText = translationData[section]?.[key] || "";

        let status: TranslationEntry["status"] = "translated";
        if (!translatedText) {
          status = "missing";
          untranslatedCount++;
        } else if (translatedText === englishText) {
          status = "same";
          untranslatedCount++;
        }

        // Check if format specifiers match
        let isInvalid = false;
        if (translatedText && status === "translated") {
          const englishSpecifiers = countFormatSpecifiers(englishText);
          const translationSpecifiers = countFormatSpecifiers(translatedText);

          if (
            englishSpecifiers.percentD !== translationSpecifiers.percentD ||
            englishSpecifiers.percentS !== translationSpecifiers.percentS
          ) {
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
          isInvalid,
        });
      });
    });

    setEntries(processedEntries);
    setStats({
      total: processedEntries.length,
      untranslated: untranslatedCount,
      invalid: invalidCount,
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
    userEditedRef.current = true;

    // Compare with original to detect changes
    // First check if the specific value has changed
    const originalValue = originalTranslationData[section]?.[key] || "";
    const hasChanged = value !== originalValue;

    // Or do a full comparison to catch any changes
    const fullComparison = JSON.stringify(newTranslationData) !== JSON.stringify(originalTranslationData);

    setHasChanges(hasChanged || fullComparison);
  };

  // Session management functions
  const createSessionData = useCallback((): SessionData => ({
    timestamp: Date.now(),
    sourceMode,
    selectedTranslation,
    localFileName,
    localEnglishFileName,
    englishData,
    translationData,
    originalTranslationData,
    availableTranslations,
  }), [sourceMode, selectedTranslation, localFileName, localEnglishFileName, englishData, translationData, originalTranslationData, availableTranslations]);

  const saveSessionImmediately = useCallback(() => {
    if (sessionState.showResumePrompt) return;
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
      debouncedSaveTimeoutRef.current = null;
    }
    const currentSession = createSessionData();
    saveSession(currentSession);
    setSessionState(prev => ({
      ...prev,
      hasSession: true,
      isAutoSaving: false,
      lastSaveTime: Date.now(),
    }));
    setHasSavedThisRun(true);
  }, [createSessionData, sessionState.showResumePrompt]);

  // Interval autosave disabled; we use debounced saving instead
  const startAutoSave = useCallback(() => {}, []);

  const stopAutoSave = useCallback(() => {
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
      debouncedSaveTimeoutRef.current = null;
    }
  }, []);

  const handleResumeSession = useCallback(() => {
    if (!initialSessionData) return;

    const session = initialSessionData;
    // Force local mode on resume to avoid any GitHub content loads
    setSourceMode("local");
    setSelectedTranslation(session.selectedTranslation);
    // Derive sensible local filenames if they were not present in the session
    const derivedLocalEnglishName = session.localEnglishFileName || "english.ini";
    const derivedLocalTranslationName = session.localFileName || session.selectedTranslation || "translation.ini";
    setLocalFileName(derivedLocalTranslationName);
    setLocalEnglishFileName(derivedLocalEnglishName);
    setEnglishData(session.englishData);
    setTranslationData(session.translationData);
    setOriginalTranslationData(session.originalTranslationData);
    setAvailableTranslations(session.availableTranslations);
    // Mirror the behavior of opening local files manually
    setHasChanges(false);
    setError(null);
    
    setSessionState(prev => ({
      ...prev,
      showResumePrompt: false,
      lastSaveTime: session.timestamp,
    }));

    // Start autosave after resuming
    startAutoSave();
    setHasSavedThisRun(false);

    // Refresh only the list of available translations from GitHub (/contents),
    // but do not load any file contents (avoid english.ini/translation files)
    (async () => {
      try {
        const iniFiles = await fetchGitHubFileNamesOnly();
        setCachedData("github_file_list", iniFiles);
        setAvailableTranslations(iniFiles);
      } catch (e) {
        // Non-critical: keep session's saved list if GitHub listing fails
        console.warn("Failed to refresh GitHub file list after resume:", e);
      }
    })();
  }, [initialSessionData, startAutoSave]);

  const handleDiscardSession = useCallback(() => {
    clearSession();
    setSessionState({
      hasSession: false,
      lastSaveTime: null,
      isAutoSaving: false,
      showResumePrompt: false,
    });
    setInitialSessionData(null);
    setHasSavedThisRun(false);
    
    // Reset to initial state and trigger GitHub loading for fresh start
    setEnglishData({});
    setTranslationData({});
    setOriginalTranslationData({});
    setSelectedTranslation("");
    setAvailableTranslations([]);
    setEntries([]);
    setHasChanges(false);
    setError(null);
  }, []);

  // Debounced save: persist to localStorage only after user stops typing
  useEffect(() => {
    if (sessionState.showResumePrompt) return;
    // Only schedule a save if this change was initiated by the user.
    // This ensures we also save when the user reverts back to the original content
    // (i.e., hasChanges becomes false), but avoid saving on programmatic loads.
    if (!userEditedRef.current) return;

    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
      debouncedSaveTimeoutRef.current = null;
    }

    setSessionState(prev => ({ ...prev, isAutoSaving: true }));
    debouncedSaveTimeoutRef.current = window.setTimeout(() => {
      const currentSession = createSessionData();
      saveSession(currentSession);
      setSessionState(prev => ({
        ...prev,
        hasSession: true,
        isAutoSaving: false,
        lastSaveTime: Date.now(),
      }));
      setHasSavedThisRun(true);
      userEditedRef.current = false;
      debouncedSaveTimeoutRef.current = null;
    }, getAutosaveInterval());

    return () => {
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }
    };
  }, [translationData, sessionState.showResumePrompt, createSessionData]);

  // Cleanup debounced save on unmount
  useEffect(() => {
    return () => stopAutoSave();
  }, []);

  const handleSave = () => {
    const content = serializeIni(translationData);

    // Save as UTF-8 to support all Unicode characters (Armenian, Russian, etc.)
    // UTF-8 is backward compatible with ASCII, so English and German files will work fine too
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sourceMode === "github" ? selectedTranslation : localFileName || "translation.ini";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update original data after save (deep clone to avoid reference issues)
    setOriginalTranslationData(JSON.parse(JSON.stringify(translationData)));
    setHasChanges(false);

    // Clear session after successful save
    clearSession();
    stopAutoSave();
    setSessionState({
      hasSession: false,
      lastSaveTime: null,
      isAutoSaving: false,
      showResumePrompt: false,
    });
  };

  // Handle source mode change
  const handleSourceModeChange = (mode: SourceMode) => {
    // Only show confirmation if there are unsaved changes (save button is active)
    if (hasChanges && mode !== sourceMode) {
      // Show confirmation dialog
      setPendingMode(mode);
      setShowModeChangeConfirm(true);
      return;
    }

    // No unsaved changes, proceed with mode change
    performSourceModeChange(mode);
  };

  // Perform the actual source mode change
  const performSourceModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    setError(null);
    if (mode === "local") {
      // Clear all data and GitHub-specific state when switching to local
      setEnglishData({});
      setTranslationData({});
      setOriginalTranslationData({});
      setEntries([]);
      // Keep the previously selected translation so switching back to GitHub
      // restores the user's choice instead of defaulting to the first file.
      setAvailableTranslations([]);
      setStats({ total: 0, untranslated: 0, invalid: 0 });
      setHasChanges(false);
      // Preserve hasInitiallyLoaded and githubInitiallyFailed
    } else {
      // Clear local-specific state when switching to GitHub
      setLocalFileName("");
      setLocalEnglishFileName("");
      // isUsingCache will be set by the useEffect based on githubInitiallyFailed
    }
  };

  // Confirm source mode change
  const confirmModeChange = () => {
    if (pendingMode) {
      performSourceModeChange(pendingMode);
      setPendingMode(null);
    }
    setShowModeChangeConfirm(false);
  };

  // Cancel source mode change
  const cancelModeChange = () => {
    setPendingMode(null);
    setShowModeChangeConfirm(false);
  };

  // Keyboard events handled inside ModeChangeDialog component

  // Filter entries based on filter mode
  const filteredEntries = entries.filter((entry) => {
    switch (filterMode) {
      case "untranslated":
        return entry.status === "missing" || entry.status === "same";
      case "invalid":
        return entry.isInvalid === true;
      case "all":
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

  // Compute per-section statistics (based on all entries, not filtered)
  const sectionStats = entries.reduce((acc, entry) => {
    if (!acc[entry.section]) {
      acc[entry.section] = { total: 0, untranslated: 0, invalid: 0 };
    }
    acc[entry.section].total += 1;
    if (entry.status === "missing" || entry.status === "same") {
      acc[entry.section].untranslated += 1;
    }
    if (entry.isInvalid) {
      acc[entry.section].invalid += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; untranslated: number; invalid: number }>);

  // Show loading state
  if (loading && sourceMode === "github") {
    return (
      <div className="app">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            color: "#fff",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "1.2rem" }}>Loading translations from GitHub...</div>
          <div style={{ color: "#888", fontSize: "0.9rem" }}>This may take a few seconds</div>
        </div>
      </div>
    );
  }

  // Show error state for GitHub but allow switching to local mode
  if (error && sourceMode === "github" && !entries.length) {
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
          lastSaveTime={!sessionState.showResumePrompt && hasSavedThisRun ? sessionState.lastSaveTime : null}
          isAutoSaving={!sessionState.showResumePrompt && hasSavedThisRun ? sessionState.isAutoSaving : false}
        />
        <GitHubErrorView
          error={error}
          onSwitchToLocal={() => handleSourceModeChange("local")}
          onRetry={() => window.location.reload()}
        />
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
        lastSaveTime={!sessionState.showResumePrompt && hasSavedThisRun ? sessionState.lastSaveTime : null}
        isAutoSaving={!sessionState.showResumePrompt && hasSavedThisRun ? sessionState.isAutoSaving : false}
        hideControls={sessionState.showResumePrompt}
      />

      {/* Session Resume Banner */}
      {sessionState.showResumePrompt && (
        <SessionResumeBanner
          timestamp={initialSessionData?.timestamp || null}
          onDiscard={handleDiscardSession}
          onResume={handleResumeSession}
        />
      )}

      {error && sourceMode === "github" && (
        <StatusBanner error={error} isUsingCache={isUsingCache} onSwitchToLocal={() => handleSourceModeChange("local")} />
      )}

      <main
        style={{
          padding: isMobile ? "1rem" : isMedium ? "1.5rem" : "2rem",
          maxWidth: isMedium ? "900px" : "1200px",
          margin: "0 auto",
        }}
      >
        {sourceMode === "local" && (!localEnglishFileName || !localFileName) && (
          <LocalFileEditor
            onFilesLoaded={handleFilesLoaded}
            onError={setError}
            localEnglishFileName={localEnglishFileName}
            localFileName={localFileName}
            onEnglishFileUpload={handleEnglishFileUpload}
            onTranslationFileUpload={handleTranslationFileUpload}
          />
        )}
        <TranslationSections
          groupedEntries={groupedEntries}
          sectionStats={sectionStats}
          screenSize={screenSize as "mobile" | "medium" | "desktop"}
          onTranslationChange={handleTranslationChange}
          onBlurSave={saveSessionImmediately}
        />
      </main>

      <ModeChangeDialog
        visible={showModeChangeConfirm}
        currentMode={sourceMode}
        pendingMode={pendingMode}
        onCancel={cancelModeChange}
        onConfirm={confirmModeChange}
      />
    </div>
  );
}

export default App;
