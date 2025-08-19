import React, { useState, useRef } from "react";
import TranslationRow from "./TranslationRow";
import type { TranslationEntry } from "../types/translation";

type ScreenSize = "mobile" | "medium" | "desktop";
type FilterType = "all" | "untranslated" | "invalid" | null;
type GlobalFilterMode = "all" | "untranslated" | "invalid";

interface TranslationSectionsProps {
  groupedEntries: Record<string, TranslationEntry[]>;
  sectionStats: Record<string, { total: number; untranslated: number; invalid: number }>;
  screenSize: ScreenSize;
  onTranslationChange: (section: string, key: string, value: string) => void;
  onFocusEntry?: (section: string, key: string) => void;
  onBlurEntry?: () => void;
  globalFilterMode?: GlobalFilterMode;
  editingEntry?: { section: string; key: string } | null;
}

const TranslationSections: React.FC<TranslationSectionsProps> = ({
  groupedEntries,
  sectionStats,
  screenSize,
  onTranslationChange,
  onFocusEntry,
  onBlurEntry,
  globalFilterMode = "all",
  editingEntry,
}) => {
  const isMobile = screenSize === "mobile";
  const isMedium = screenSize === "medium";
  
  // Track active filter for each section
  const [sectionFilters, setSectionFilters] = useState<Record<string, FilterType>>({});
  
  // Refs for each section to enable scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Refs for first translation field in each section
  const firstFieldRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleFilterClick = (section: string, filterType: FilterType) => {
    setSectionFilters(prev => ({
      ...prev,
      [section]: prev[section] === filterType ? null : filterType
    }));
    
    // Scroll to the section header and focus first field
    setTimeout(() => {
      const sectionElement = sectionRefs.current[section];
      if (sectionElement) {
        // Since section headers are sticky, scroll a bit above the section
        const offset = 10; // Small offset from top
        const targetPosition = sectionElement.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
      
      // Focus the first translation field in this section
      setTimeout(() => {
        const firstField = firstFieldRefs.current[section];
        if (firstField) {
          firstField.focus();
          firstField.select();
        }
      }, 350); // Delay to allow smooth scroll to complete
    }, 50); // Small delay to ensure DOM updates
  };

  const getFilteredEntries = (section: string, entries: TranslationEntry[]) => {
    // Section filter overrides global filter
    const activeFilter = sectionFilters[section] || globalFilterMode;
    
    // Always show the currently editing entry regardless of filter
    const filteredEntries = entries.filter(entry => {
      if (editingEntry && entry.section === editingEntry.section && entry.key === editingEntry.key) {
        return true;
      }
      
      if (activeFilter === "all") return true;
      
      if (activeFilter === "untranslated") {
        return entry.status === "missing" || entry.status === "same";
      }
      
      if (activeFilter === "invalid") {
        return entry.isInvalid;
      }
      
      return true;
    });
    
    return filteredEntries;
  };

  // Check if a section should be visible based on global filter
  const shouldShowSection = (section: string, entries: TranslationEntry[]) => {
    // Always show if there's a section-specific filter
    if (sectionFilters[section]) return true;
    
    // Always show the section containing the currently editing entry
    if (editingEntry && editingEntry.section === section) return true;
    
    // Always show all sections if global filter is "all"
    if (globalFilterMode === "all") return true;
    
    // Check if section has any entries matching the global filter
    if (globalFilterMode === "untranslated") {
      return entries.some(entry => entry.status === "missing" || entry.status === "same");
    }
    
    if (globalFilterMode === "invalid") {
      return entries.some(entry => entry.isInvalid);
    }
    
    return true;
  };

  // Count hidden sections
  const totalSections = Object.keys(groupedEntries).length;
  const visibleSections = Object.keys(groupedEntries).filter(section => 
    shouldShowSection(section, groupedEntries[section])
  ).length;
  const hiddenSections = totalSections - visibleSections;

  return (
    <div style={{ position: "relative" }}>
      {hiddenSections > 0 && globalFilterMode !== "all" && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          border: "1px solid rgba(255, 152, 0, 0.3)",
          borderRadius: "4px",
          color: "#ff9800",
          fontSize: "0.9rem",
          textAlign: "center"
        }}>
          {hiddenSections} section{hiddenSections !== 1 ? 's' : ''} hidden by the filter
        </div>
      )}
      {Object.keys(groupedEntries).map((section) => {
        const allEntries = groupedEntries[section];
        
        // Skip sections that don't match the global filter
        if (!shouldShowSection(section, allEntries)) {
          return null;
        }
        
        const filteredEntries = getFilteredEntries(section, allEntries);
        const sectionFilter = sectionFilters[section];
        const activeFilter = sectionFilter || globalFilterMode;
        
        return (
        <div 
          key={section} 
          ref={(el) => { sectionRefs.current[section] = el; }}
          style={{ marginBottom: "3rem" }}
        >
          {section && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                backgroundColor: "#0a0a0a",
                paddingTop: "1rem",
                paddingBottom: "0.5rem",
                marginTop: "-1rem",
                marginBottom: "1rem",
              }}
            >
              <h2
                style={{
                  color: "#888",
                  fontSize: isMobile ? "1.1rem" : isMedium ? "1.2rem" : "1.25rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid #333",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: 0,
                }}
              >
                <span>[{section}]</span>
                {(sectionStats[section]?.total ?? 0) > 0 && (
                  <span 
                    onClick={() => handleFilterClick(section, "all")}
                    style={{ 
                      color: activeFilter === "all" ? "#000" : "#fff", 
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: activeFilter === "all" ? (sectionFilter === "all" ? "#fff" : "rgba(255, 255, 255, 0.8)") : "transparent",
                      border: activeFilter === "all" ? "1px solid #fff" : "1px solid transparent",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                      opacity: activeFilter === "all" && !sectionFilter ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (activeFilter !== "all") {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeFilter !== "all") {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.border = "1px solid transparent";
                      }
                    }}
                    title="Show all entries"
                  >
                    ({sectionStats[section]!.total})
                  </span>
                )}
                {(sectionStats[section]?.untranslated ?? 0) > 0 && (
                  <span 
                    onClick={() => handleFilterClick(section, "untranslated")}
                    style={{ 
                      color: activeFilter === "untranslated" ? "#ffb84d" : "#ff9800", 
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: activeFilter === "untranslated" ? "rgba(255, 152, 0, 0.15)" : "transparent",
                      border: activeFilter === "untranslated" ? "1px solid rgba(255, 152, 0, 0.4)" : "1px solid transparent",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                      opacity: activeFilter === "untranslated" && !sectionFilter ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (activeFilter !== "untranslated") {
                        e.currentTarget.style.backgroundColor = "rgba(255, 152, 0, 0.1)";
                        e.currentTarget.style.border = "1px solid rgba(255, 152, 0, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeFilter !== "untranslated") {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.border = "1px solid transparent";
                      }
                    }}
                    title="Show only untranslated entries"
                  >
                    ({sectionStats[section]!.untranslated})
                  </span>
                )}
                {(sectionStats[section]?.invalid ?? 0) > 0 && (
                  <span 
                    onClick={() => handleFilterClick(section, "invalid")}
                    style={{ 
                      color: activeFilter === "invalid" ? "#ff6666" : "#ff4444", 
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: activeFilter === "invalid" ? "rgba(255, 68, 68, 0.15)" : "transparent",
                      border: activeFilter === "invalid" ? "1px solid rgba(255, 68, 68, 0.4)" : "1px solid transparent",
                      transition: "all 0.2s ease",
                      userSelect: "none",
                      opacity: activeFilter === "invalid" && !sectionFilter ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (activeFilter !== "invalid") {
                        e.currentTarget.style.backgroundColor = "rgba(255, 68, 68, 0.1)";
                        e.currentTarget.style.border = "1px solid rgba(255, 68, 68, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeFilter !== "invalid") {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.border = "1px solid transparent";
                      }
                    }}
                    title="Show only invalid entries"
                  >
                    ({sectionStats[section]!.invalid})
                  </span>
                )}
              </h2>
            </div>
          )}
          {filteredEntries.map((entry, index) => (
            <TranslationRow
              key={`${entry.section}-${entry.key}`}
              entry={entry}
              onTranslationChange={onTranslationChange}
              screenSize={screenSize}
              onFocusEntry={onFocusEntry}
              onBlurEntry={onBlurEntry}
              ref={index === 0 ? (el) => {
                if (el) firstFieldRefs.current[section] = el;
              } : undefined}
            />
          ))}
        </div>
        );
      })}
    </div>
  );
};

export default TranslationSections;


