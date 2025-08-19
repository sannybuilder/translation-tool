import React, { useEffect, useMemo, useState } from "react";
import { formatLastSaveTime } from "../utils/sessionManager";

interface SessionResumeBannerProps {
  timestamp: number | null;
  onDiscard: () => void;
  onResume: () => void;
}

const SessionResumeBanner: React.FC<SessionResumeBannerProps> = ({ timestamp, onDiscard, onResume }) => {
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    let cancelled = false;
    let timeoutId: number | null = null;

    const schedule = () => {
      if (cancelled) return;
      const diff = Date.now() - timestamp;
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
  }, [timestamp]);

  const lastSavedLabel = useMemo(() => {
    if (!timestamp) return '';
    return formatLastSaveTime(timestamp);
  }, [timestamp, timeTick]);

  return (
    <div className="session-banner">
      <div className="session-banner-content">
        <div className="session-banner-text">
          You have an unsaved session from {lastSavedLabel}. Would you like to resume where you left off?
        </div>
        <div className="session-banner-actions">
          <button
            className="session-banner-btn"
            onClick={onDiscard}
          >
            Start Fresh
          </button>
          <button
            className="session-banner-btn primary"
            onClick={onResume}
          >
            Resume Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionResumeBanner;


