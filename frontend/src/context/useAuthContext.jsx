import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next';
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const AuthContext = createContext(undefined);
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
const authSessionKey = '_Ace_AUTH_KEY_';
const lockScreenKey = '_Ace_LOCK_SCREEN_';
const LOCK_SCREEN_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AuthProvider({
  children
}) {
  const navigate = useNavigate();
  const getSession = () => {
    const fetchedCookie = getCookie(authSessionKey)?.toString();
    if (!fetchedCookie) return;else return JSON.parse(fetchedCookie);
  };
  const [user, setUser] = useState(getSession());
  
  const getLockScreenTimestamp = () => {
    const timestamp = getCookie(lockScreenKey);
    return timestamp ? parseInt(timestamp, 10) : null;
  };
  
  const isLockScreenExpired = () => {
    const timestamp = getLockScreenTimestamp();
    if (!timestamp) return false;
    const now = Date.now();
    return (now - timestamp) > LOCK_SCREEN_TIMEOUT;
  };
  
  const lockScreen = () => {
    const timestamp = Date.now();
    setCookie(lockScreenKey, timestamp.toString(), {
      maxAge: 60 * 10 // 10 minutes (longer than timeout to allow cleanup)
    });
  };
  
  const unlockScreen = () => {
    deleteCookie(lockScreenKey);
  };
  
  const saveSession = (user, rememberMe = false) => {
    // If rememberMe is true, set cookie to expire in 30 days
    // If false, it's a session cookie (expires when browser closes)
    // cookies-next uses 'maxAge' in seconds for expiration
    const cookieOptions = rememberMe ? {
      maxAge: 60 * 60 * 24 * 30 // 30 days in seconds (60 sec * 60 min * 24 hours * 30 days)
    } : {
      // Session cookie - expires when browser closes (no maxAge)
    };
    
    // Clear any old session data first to prevent caching issues
    deleteCookie(authSessionKey);
    
    setCookie(authSessionKey, JSON.stringify(user), cookieOptions);
    setUser(user);
  };
  const removeSession = () => {
    deleteCookie(authSessionKey);
    deleteCookie(lockScreenKey);
    setUser(undefined);
    navigate('/auth/sign-in');
  };
  return <AuthContext.Provider value={{
    user,
    isAuthenticated: hasCookie(authSessionKey),
    saveSession,
    removeSession,
    lockScreen,
    unlockScreen,
    isLockScreenExpired,
    getLockScreenTimestamp
  }}>
      {children}
    </AuthContext.Provider>;
}