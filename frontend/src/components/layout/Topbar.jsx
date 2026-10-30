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
  const profileLabel = user
    ? roleLabels[user.role] || 'Perfil indisponível'
    : status === 'checking'
      ? 'Verificando sessão...'
      : status === 'error'
        ? 'Sessão não verificada'
        : 'Visitante';
  const initials = user ? profileLabel.slice(0, 2).toLocaleUpperCase('pt-BR') : '?';
  const title = pageTitles[location.pathname] || 'PetSystem';

  return (
    <header className="app-topbar">
      <div>
        <h1>{title}</h1>
      </div>

      <div className="topbar-user" role="group" aria-label="Perfil do usuário atual">
        <span className="topbar-avatar" aria-hidden="true">{initials || '?'}</span>
        <strong className="topbar-user-name">{profileLabel}</strong>
      </div>
    </header>
  );
}
