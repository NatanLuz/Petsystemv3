import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../../features/auth/AuthContext';

const navigationItems = [
  { label: "Dashboard", to: "/", enabled: true },
  { label: "Clientes", to: "/clients", enabled: true },
  { label: "Pets", to: "/pets", enabled: true },
  { label: "Serviços", to: "/services", enabled: true },
  { label: "Agendamentos", to: "/appointments", enabled: true },
  { label: "Atendimentos", enabled: false },
];

export default function Sidebar() {
  const { user, status, operation, error, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    if (await logout()) navigate('/login', { replace: true });
  }
  return (
    <aside className="app-sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand">
        <strong>PetSystem V3</strong>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) =>
          item.enabled ? (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
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
          <button className="btn btn-secondary" onClick={handleLogout} disabled={Boolean(operation)}>
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
