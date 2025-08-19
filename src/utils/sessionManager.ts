import type { SessionData } from '../types/session';

const SESSION_KEY = 'translation_tool_session';
const AUTOSAVE_INTERVAL = 5000; // 5 seconds

export const saveSession = (data: SessionData): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

export const loadSession = (): SessionData | null => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

export const hasSession = (): boolean => {
  return localStorage.getItem(SESSION_KEY) !== null;
};

export const getAutosaveInterval = (): number => {
  return AUTOSAVE_INTERVAL;
};

export const formatLastSaveTime = (timestamp: number | null): string => {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) { // Less than 1 minute
    if (diff < 10000) return 'Just now';
    const seconds = Math.floor(diff / 1000);
    const roundedToTen = Math.max(10, Math.floor(seconds / 10) * 10);
    return `${roundedToTen} seconds ago`;
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};
