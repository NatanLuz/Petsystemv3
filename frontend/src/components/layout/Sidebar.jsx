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

const navIcons = {
  '/': 'M3 10.5 12 3l9 7.5M5 9v12h14V9M9 21v-7h6v7',
  '/clients': 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m6-7.5a4 4 0 0 1 0 7.75M20 21v-2a4 4 0 0 0-3-3.87',
  '/pets': 'M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.9A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11ZM5 4l1.5 1M19 4l-1.5 1',
  '/services': 'M4 7h16M4 12h16M4 17h10M7 4v3m10-3v3',
  '/appointments': 'M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h3m-3 4h7',
  '/attendances': 'M8 4h8l3 3v13H5V4h3Zm1 0v5h6V4m-6 9h6m-6 3h6',
};

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
              <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={navIcons[item.to]} /></svg>
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
