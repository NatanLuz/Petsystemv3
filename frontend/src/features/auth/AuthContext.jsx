import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authErrorMessage, getCurrentUser, initializeCsrf, loginUser, logoutUser } from './authService';
import api from '../../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  const [operation, setOperation] = useState(null);
  const [error, setError] = useState('');
  const [apiNotice, setApiNotice] = useState('');
  const busy = useRef(true);
  const mounted = useRef(false);
  const initialRequest = useRef(null);
  const sessionGeneration = useRef(0);
  const csrfRecovery = useRef(null);

  useEffect(() => {
    let subscribed = true;
    const isCurrent = (generation) => subscribed && mounted.current && generation === sessionGeneration.current;
    function endSession(generation) {
      if (!isCurrent(generation)) return;
      sessionGeneration.current += 1;
      setUser(null);
      setStatus('guest');
      setApiNotice('');
      setError('Sua sessão foi encerrada. Entre novamente.');
    }

    async function recoverCsrf(generation) {
      if (csrfRecovery.current) return csrfRecovery.current;
      const recovery = (async () => {
        try {
          await initializeCsrf();
          if (!isCurrent(generation)) return;
          const identity = await getCurrentUser();
          if (!isCurrent(generation)) return;
          setUser(identity);
          // Keep the page mounted: the original operation is never replayed.
          setApiNotice('A proteção da sessão foi renovada. Seus dados continuam no formulário; tente a operação novamente.');
        } catch (failure) {
          if (!isCurrent(generation)) return;
          if (failure.response?.status === 401) {
            endSession(generation);
          } else {
            setApiNotice('Não foi possível verificar a sessão e renovar sua proteção. Tente novamente em instantes.');
          }
        }
      })();
      csrfRecovery.current = recovery;
      try {
        await recovery;
      } finally {
        if (csrfRecovery.current === recovery) csrfRecovery.current = null;
      }
    }

    const requestInterceptor = api.interceptors.request.use((config) => {
      // Only the four resource services participate; auth and health are excluded.
      if (/^\/?(clients|pets|services|appointments)(?:\/|\?|$)/.test(config.url || '')) {
        config.sessionGeneration = sessionGeneration.current;
      }
      return config;
    }, undefined, { synchronous: true });

    const responseInterceptor = api.interceptors.response.use((response) => response, async (failure) => {
      const generation = failure.config?.sessionGeneration;
      if (generation !== undefined && isCurrent(generation)) {
        const code = failure.response?.status;
        if (code === 401) endSession(generation);
        if (code === 403) setApiNotice('Acesso negado para esta operação. Sua sessão permanece ativa.');
        if (code === 419) {
          setApiNotice('A proteção da sessão expirou. Verificando a sessão...');
          await recoverCsrf(generation);
        }
      }
      return Promise.reject(failure);
    });

    return () => {
      subscribed = false;
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

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
    const generation = ++sessionGeneration.current;
    setOperation(action);
    setError('');
    setApiNotice('');
    try {
      // Finish any cookie recovery before starting another auth operation.
      await csrfRecovery.current;
      const identity = await request();
      if (!mounted.current || generation !== sessionGeneration.current) return false;
      sessionGeneration.current += 1;
      setUser(identity || null);
      setStatus(identity ? 'authenticated' : 'guest');
      return true;
    } catch (failure) {
      if (!mounted.current || generation !== sessionGeneration.current) return false;
      if (failure.response?.status === 401) {
        setUser(null);
        setStatus('guest');
        // The backend confirms that no authenticated session remains.
        if (action !== 'login') return true;
      }
      const message = await authErrorMessage(failure);
      if (mounted.current && generation === sessionGeneration.current) {
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
    user, status, operation, error, apiNotice,
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
