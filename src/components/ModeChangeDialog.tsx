import React, { useEffect } from "react";

type SourceMode = "github" | "local";

interface ModeChangeDialogProps {
  visible: boolean;
  currentMode: SourceMode;
  pendingMode: SourceMode | null;
  onCancel: () => void;
  onConfirm: () => void;
  hasChanges?: boolean;
  pendingChangesCount?: number;
}

const ModeChangeDialog: React.FC<ModeChangeDialogProps> = ({
  visible,
  currentMode,
  pendingMode,
  onCancel,
  onConfirm,
  hasChanges = false,
  pendingChangesCount = 0,
}) => {
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      else if (event.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onCancel, onConfirm]);

  if (!visible) return null;

  const currentLabel = currentMode === "github" ? "GitHub" : "Local File";
  const targetLabel = pendingMode === "github" ? "GitHub" : "Local File";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #444",
          borderRadius: "8px",
          padding: "2rem",
          maxWidth: "500px",
          width: "100%",
          color: "#fff",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            color: "#f44336",
            fontSize: "1.2rem",
          }}
        >
          ⚠️ Warning: Cache Will Be Deleted
        </h3>

        <p
          style={{
            margin: "0 0 1.5rem 0",
            lineHeight: "1.6",
            color: "#ccc",
          }}
        >
          Switching from <strong>{currentLabel}</strong> mode to {" "}
          <strong>{targetLabel}</strong> mode will delete your local editing cache (files are not uploaded anywhere).
        </p>
        
        <ul
          style={{
            margin: "0 0 1.5rem 0",
            lineHeight: "1.6",
            color: "#ccc",
            paddingLeft: "1.5rem",
          }}
        >
          {hasChanges && (
            <li><strong>Unsaved edits</strong> in the current cache</li>
          )}
          {pendingChangesCount > 0 && (
            <li><strong>{pendingChangesCount} pending changes</strong> waiting for review</li>
          )}
          <li>Your current <strong>local editing cache</strong></li>
        </ul>

        <p
          style={{
            margin: "0 0 1.5rem 0",
            lineHeight: "1.6",
            color: "#ccc",
          }}
        >
          Please download or copy your work or submit pending changes first, or confirm to delete the cache.
        </p>

        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "0.85rem",
            color: "#888",
            fontStyle: "italic",
          }}
        >
          Press <kbd style={{ padding: "0.1rem 0.3rem", backgroundColor: "#333", borderRadius: "3px" }}>ESC</kbd> to
          cancel or {" "}
          <kbd style={{ padding: "0.1rem 0.3rem", backgroundColor: "#333", borderRadius: "3px" }}>Enter</kbd> to
          confirm.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              backgroundColor: "#2a2a2a",
              color: "#fff",
              border: "1px solid #444",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.3s ease",
            }}
            title="Cancel and keep current changes"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3a3a3a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2a2a2a";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: "#f44336",
              color: "#fff",
              border: "1px solid #f44336",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.3s ease",
            }}
            title="Discard unsaved changes and switch mode"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d32f2f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f44336";
            }}
          >
            Delete Cache
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeChangeDialog;


