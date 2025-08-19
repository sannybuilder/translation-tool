import React from "react";

interface GitHubErrorViewProps {
  error: string;
  onSwitchToLocal: () => void;
  onRetry: () => void;
}

const GitHubErrorView: React.FC<GitHubErrorViewProps> = ({ error, onSwitchToLocal, onRetry }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
        padding: "2rem",
        color: "#fff",
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "2rem",
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#ff9800", marginBottom: "1rem" }}>GitHub Connection Failed</h2>
        <p style={{ color: "#aaa", marginBottom: "1.5rem", lineHeight: "1.6" }}>{error}</p>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "#fff", marginBottom: "1rem", fontWeight: "bold" }}>
            You can still work with local files:
          </p>
          <ol
            style={{
              textAlign: "left",
              color: "#aaa",
              lineHeight: "1.8",
              paddingLeft: "1.5rem",
            }}
          >
            <li>Click "Local Files" button above</li>
            <li>Upload your english.ini file</li>
            <li>Upload the translation file you want to edit</li>
            <li>Start editing translations offline</li>
          </ol>
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={onSwitchToLocal}
            style={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
            title="Switch to local files mode"
          >
            Switch to Local Files
          </button>
          <button
            onClick={onRetry}
            style={{
              backgroundColor: "#333",
              color: "#fff",
              border: "1px solid #555",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
            title="Retry loading from GitHub"
          >
            Retry GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubErrorView;


