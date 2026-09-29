import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

// Resolve the session before mounting the internal layout and its pages.
export default function ProtectedRoute({ children }) {
  const { user, status, operation, error, refreshUser } = useAuth();
  if (status === 'checking' || operation === 'checking') {
    return <p className="clients-state" role="status">Verificando sessão...</p>;
  }
  if (status === 'error') {
    return <div className="clients-feedback clients-feedback-error" role="alert">
      <p>{error}</p>
      <button className="btn btn-secondary" onClick={refreshUser}>Tentar novamente</button>
    </div>;
  }
  return user ? (children || <Outlet />) : <Navigate to="/login" replace />;
}
