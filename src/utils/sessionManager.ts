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


