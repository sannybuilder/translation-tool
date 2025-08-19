import React from "react";
import TranslationRow from "./TranslationRow";
import type { TranslationEntry } from "../types/translation";

type ScreenSize = "mobile" | "medium" | "desktop";

interface TranslationSectionsProps {
  groupedEntries: Record<string, TranslationEntry[]>;
  sectionStats: Record<string, { total: number; untranslated: number; invalid: number }>;
  screenSize: ScreenSize;
  onTranslationChange: (section: string, key: string, value: string) => void;
  onBlurSave: () => void;
}

const TranslationSections: React.FC<TranslationSectionsProps> = ({
  groupedEntries,
  sectionStats,
  screenSize,
  onTranslationChange,
  onBlurSave,
}) => {
  const isMobile = screenSize === "mobile";
  const isMedium = screenSize === "medium";

  return (
    <>
      {Object.keys(groupedEntries).map((section) => (
        <div key={section} style={{ marginBottom: "3rem", position: "relative" }}>
          {section && (
            <h2
              style={{
                color: "#888",
                fontSize: isMobile ? "1.1rem" : isMedium ? "1.2rem" : "1.25rem",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                paddingTop: "0.5rem",
                borderBottom: "1px solid #333",
                position: "sticky",
                top: "var(--header-height, 112px)",
                backgroundColor: "#0a0a0a",
                zIndex: 50,
                marginTop: "-0.5rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>[{section}]</span>
              {(sectionStats[section]?.total ?? 0) > 0 && (
                <span style={{ color: "#fff", fontSize: "0.9rem" }}>({sectionStats[section]!.total})</span>
              )}
              {(sectionStats[section]?.untranslated ?? 0) > 0 && (
                <span style={{ color: "#ff9800", fontSize: "0.9rem" }}>({sectionStats[section]!.untranslated})</span>
              )}
              {(sectionStats[section]?.invalid ?? 0) > 0 && (
                <span style={{ color: "#ff4444", fontSize: "0.9rem" }}>({sectionStats[section]!.invalid})</span>
              )}
            </h2>
          )}
          {groupedEntries[section].map((entry) => (
            <TranslationRow
              key={`${entry.section}-${entry.key}`}
              entry={entry}
              onTranslationChange={onTranslationChange}
              onBlurSave={onBlurSave}
              screenSize={screenSize}
            />
          ))}
        </div>
      ))}
    </>
  );
};

export default TranslationSections;


