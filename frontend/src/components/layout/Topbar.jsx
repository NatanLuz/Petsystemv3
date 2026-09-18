import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Gerenciar Clientes',
  '/health': 'Status da API',
};

export default function Topbar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'PetSystem';

  return (
    <header className="app-topbar">
      <div>
        <span className="topbar-kicker">PETSYSTEM V3</span>
        <h1>{title}</h1>
      </div>

      <div className="topbar-user" aria-label="Usuário atual">
        <span className="topbar-avatar">A</span>
        <div>
          <strong>Administrador</strong>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}
