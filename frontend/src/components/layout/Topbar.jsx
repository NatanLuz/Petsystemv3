import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Gerenciar Clientes',
  '/pets': 'Gerenciar Pets',
  '/health': 'Status da API',
};

export default function Topbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'PetSystem';

  return (
    <header className="app-topbar">
      <div>
        <h1>{title}</h1>
      </div>

      <div className="topbar-user" aria-label="Usuário atual">
        <span className="topbar-avatar">A</span>
        <strong>Administrador</strong>
      </div>
    </header>
  );
}
