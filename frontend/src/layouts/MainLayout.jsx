import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
