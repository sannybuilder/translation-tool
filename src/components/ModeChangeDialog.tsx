import React, { useEffect } from "react";

type SourceMode = "github" | "local";

interface ModeChangeDialogProps {
  visible: boolean;
  currentMode: SourceMode;
  pendingMode: SourceMode | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const ModeChangeDialog: React.FC<ModeChangeDialogProps> = ({
  visible,
  currentMode,
  pendingMode,
  onCancel,
  onConfirm,
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
          ⚠️ Unsaved Changes
        </h3>

        <p
          style={{
            margin: "0 0 1.5rem 0",
            lineHeight: "1.6",
            color: "#ccc",
          }}
        >
          You have <strong>unsaved changes</strong> that will be lost when switching from {" "}
          <strong>{currentLabel}</strong> mode to {" "}
          <strong>{targetLabel}</strong> mode.
          <br />
          <br />
          Please save your work first or confirm to discard the changes.
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
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeChangeDialog;


