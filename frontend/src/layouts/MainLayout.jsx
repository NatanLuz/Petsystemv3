import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../features/auth/AuthContext';

export default function MainLayout({ children }) {
  const { apiNotice } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="page-content">
          {apiNotice && <p className="clients-feedback clients-feedback-error" role="alert">{apiNotice}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
