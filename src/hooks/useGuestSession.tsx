import { useState, useEffect } from 'react';

interface GuestSession {
  sessionId: string;
  createdAt: number;
}

const GUEST_SESSION_KEY = 'rawi_guest_session';
const SESSION_EXPIRY_HOURS = 24;

export const useGuestSession = () => {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedSession = localStorage.getItem(GUEST_SESSION_KEY);
    if (storedSession) {
      try {
        const session: GuestSession = JSON.parse(storedSession);
        
        // Check if session is still valid (within 24 hours)
        const now = Date.now();
        const sessionAge = now - session.createdAt;
        const maxAge = SESSION_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in ms
        
        if (sessionAge < maxAge) {
          setGuestSession(session);
          return;
        } else {
          // Session expired, remove it
          localStorage.removeItem(GUEST_SESSION_KEY);
        }
      } catch (error) {
        console.error('Error parsing guest session:', error);
        localStorage.removeItem(GUEST_SESSION_KEY);
      }
    }
    
    // Create new session if none exists or expired
    createNewSession();
  }, []);

  const createNewSession = () => {
    // Generate a secure random session ID
    const sessionId = btoa(crypto.getRandomValues(new Uint8Array(32)).join(''));
    const newSession: GuestSession = {
      sessionId,
      createdAt: Date.now()
    };
    
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(newSession));
    setGuestSession(newSession);
  };

  const clearSession = () => {
    localStorage.removeItem(GUEST_SESSION_KEY);
    setGuestSession(null);
  };

  const getSessionId = (): string | null => {
    return guestSession?.sessionId || null;
  };

  return {
    guestSession,
    sessionId: getSessionId(),
    createNewSession,
    clearSession
  };
};