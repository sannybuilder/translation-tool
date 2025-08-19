import React from "react";

interface StatusBannerProps {
  error: string;
  isUsingCache?: boolean;
  onSwitchToLocal: () => void;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ error, isUsingCache = false, onSwitchToLocal }) => {
  return (
    <div
      style={{
        backgroundColor: isUsingCache ? "#4CAF501a" : "#ff98001a",
        color: isUsingCache ? "#4CAF50" : "#ff9800",
        padding: "1rem 2rem",
        borderBottom: isUsingCache ? "1px solid #4CAF50" : "1px solid #ff9800",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <span>{error}</span>
      {!isUsingCache && (
        <button
          onClick={onSwitchToLocal}
          style={{
            backgroundColor: "#ff9800",
            color: "#000",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
          title="Switch to Local Mode"
        >
          Switch to Local Mode
        </button>
      )}
    </div>
  );
};

export default StatusBanner;


