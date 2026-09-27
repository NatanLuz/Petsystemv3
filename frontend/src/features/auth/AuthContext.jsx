import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authErrorMessage, getCurrentUser, loginUser, logoutUser } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  const [operation, setOperation] = useState(null);
  const [error, setError] = useState('');
  const busy = useRef(true);
  const mounted = useRef(false);
  const initialRequest = useRef(null);

  useEffect(() => {
    mounted.current = true;
    let subscribed = true;
    // Reuse the initial request across StrictMode's effect setup/cleanup cycle.
    initialRequest.current ??= getCurrentUser();
    initialRequest.current.then((identity) => {
      if (!subscribed) return;
      setUser(identity);
      setStatus('authenticated');
    }).catch(async (failure) => {
      if (!subscribed) return;
      const message = failure.response?.status === 401 ? '' : await authErrorMessage(failure);
      if (!subscribed) return;
      setStatus(message ? 'error' : 'guest');
      setError(message);
    }).finally(() => {
      if (subscribed) busy.current = false;
    });
    return () => {
      subscribed = false;
      mounted.current = false;
    };
  }, []);

  async function run(action, request) {
    if (busy.current) return false;
    busy.current = true;
    setOperation(action);
    setError('');
    try {
      const identity = await request();
      if (!mounted.current) return false;
      setUser(identity || null);
      setStatus(identity ? 'authenticated' : 'guest');
      return true;
    } catch (failure) {
      if (!mounted.current) return false;
      if (failure.response?.status === 401) {
        setUser(null);
        setStatus('guest');
        // The backend confirms that no authenticated session remains.
        if (action !== 'login') return true;
      }
      const message = await authErrorMessage(failure);
      if (mounted.current) {
        setError(message);
        if (action === 'checking') setStatus('error');
      }
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setOperation(null);
    }
  }

  const value = {
    user, status, operation, error,
    login: (credentials) => run('login', () => loginUser(credentials)),
    logout: () => run('logout', logoutUser),
    refreshUser: () => run('checking', getCurrentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
