import React from 'react';
import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Dashboard', to: '/', enabled: true },
  { label: 'Clientes', to: '/clients', enabled: true },
  { label: 'Pets', to: '/pets', enabled: true },
  { label: 'Serviços', to: '/services', enabled: true },
  { label: 'Atendimentos', enabled: false },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Navegação principal">
      <div className="sidebar-brand">
        <strong>PetSystem</strong>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) =>
          item.enabled ? (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
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
        <span className="sidebar-link sidebar-link-disabled" aria-disabled="true">
          Sair
        </span>
      </div>
    </aside>
  );
}
