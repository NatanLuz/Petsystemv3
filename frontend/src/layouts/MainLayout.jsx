import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../features/auth/AuthContext';

export default function MainLayout({ children }) {
  const { apiNotice } = useAuth();
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="page-content" id="main-content" tabIndex={-1}>
          {apiNotice && <p className="clients-feedback clients-feedback-error" role="alert">{apiNotice}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
