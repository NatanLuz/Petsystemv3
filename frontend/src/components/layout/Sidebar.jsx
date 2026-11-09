import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../../features/auth/AuthContext';

const navigationItems = [
  { label: "Dashboard", to: "/", enabled: true },
  { label: "Clientes", to: "/clients", enabled: true },
  { label: "Pets", to: "/pets", enabled: true },
  { label: "Serviços", to: "/services", enabled: true },
  { label: "Agendamentos", to: "/appointments", enabled: true },
  { label: "Atendimentos", to: "/attendances", enabled: true },
];

const roleLabels = { admin: 'Administrador', receptionist: 'Recepcionista', veterinarian: 'Veterinário' };

export default function Sidebar() {
  const { user, status, operation, error, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    if (await logout()) navigate('/login', { replace: true });
  }
  return (
    <aside className={`app-sidebar${mobileOpen ? ' sidebar-open' : ''}`} aria-label="Navegação principal">
      <div className="sidebar-brand">
        <strong>PetSystem V3</strong>
        <button type="button" className="sidebar-toggle" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="main-sidebar-nav" onClick={() => setMobileOpen((open) => !open)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={mobileOpen ? 'm6 6 12 12M18 6 6 18' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
        </button>
      </div>

      <nav className="sidebar-nav" id="main-sidebar-nav">
        {navigationItems.map((item) =>
          item.enabled ? (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ) : (
            <span
              key={item.label}
              className="sidebar-link sidebar-link-disabled"
              aria-disabled="true"
            >
              {item.label}
            </span>
          ),
        )}
      </nav>

      <div className="sidebar-footer">
        {error && <p className="clients-feedback clients-feedback-error" role="alert">{error}</p>}
        {user ? (
          <>
            <div className="sidebar-identity"><strong>{user.name}</strong><span>{roleLabels[user.role] || 'Perfil'}</span></div>
            <button className="btn btn-secondary sidebar-logout" onClick={handleLogout} disabled={Boolean(operation)}>
              {operation === 'logout' ? 'Saindo...' : 'Sair'}
            </button>
          </>
        ) : status === 'checking' || operation === 'checking' ? (
          <span className="sidebar-link" role="status">Verificando sessão...</span>
        ) : status === 'error' ? (
          <button className="btn btn-secondary" onClick={refreshUser}>Verificar sessão</button>
        ) : (
          <NavLink className="sidebar-link" to="/login">Entrar</NavLink>
        )}
      </div>
    </aside>
  );
}
