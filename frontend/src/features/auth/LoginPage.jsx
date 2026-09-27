import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { user, status, operation, error, login, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    await login({ email: email.trim(), password });
    setPassword('');
  }

  return (
    <main className="auth-page">
      <section className="auth-panel client-form-panel" aria-labelledby="login-title">
        <header className="client-form-header">
          <h1 id="login-title">PetSystem V3</h1>
          <p>Entre com sua conta.</p>
        </header>
        {error && <p className="clients-feedback clients-feedback-error" role="alert">{error}</p>}
        {status === 'checking' || operation === 'checking' ? (
          <p className="clients-state" role="status">Verificando sessão...</p>
        ) : status === 'error' ? (
          <button className="btn btn-secondary" onClick={refreshUser}>Verificar sessão novamente</button>
        ) : (
          <form className="clients-page" onSubmit={handleSubmit} aria-busy={operation === 'login'}>
            <label className="client-field" htmlFor="login-email">
              E-mail
              <input id="login-email" type="email" autoComplete="username" required maxLength={255}
                value={email} onChange={(event) => setEmail(event.target.value)} disabled={Boolean(operation)} />
            </label>
            <label className="client-field" htmlFor="login-password">
              Senha
              <input id="login-password" type="password" autoComplete="current-password" required
                value={password} onChange={(event) => setPassword(event.target.value)} disabled={Boolean(operation)} />
            </label>
            <button className="btn btn-primary" type="submit" disabled={Boolean(operation)}>
              {operation === 'login' ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
