import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const roleLabels = { admin: 'Administrador', receptionist: 'Recepção', veterinarian: 'Veterinário' };

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Clientes',
  '/pets': 'Pets',
  '/services': 'Serviços',
  '/appointments': 'Agendamentos',
  '/health': 'Status da API',
};

export default function Topbar() {
  const location = useLocation();
  const { user, status } = useAuth();
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const title = pageTitles[location.pathname] || 'PetSystem';

  return (
    <header className="app-topbar">
      <div>
        <h1>{title}</h1>
      </div>

      <div className="topbar-user" aria-label="Usuário atual">
        <span className="topbar-avatar" aria-hidden="true">{initials || '?'}</span>
        <div>
          <strong>{user?.name || (status === 'checking' ? 'Verificando sessão...' : status === 'error' ? 'Sessão não verificada' : 'Visitante')}</strong>
          {user && <p>{roleLabels[user.role] || user.role}</p>}
        </div>
      </div>
    </header>
  );
}
