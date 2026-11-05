import { useEffect, useState } from 'react';

const navigationItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Clientes', href: '/clients' },
  { label: 'Pets', href: '#', disabled: true },
  { label: 'Serviços', href: '/services' },
  { label: 'Atendimentos', href: '#', disabled: true },
];

function getCurrentPath() {
  return window.location.pathname;
}

export function Sidebar() {
  const [currentPath, setCurrentPath] = useState(getCurrentPath);

  useEffect(() => {
    function handleLocationChange() {
      setCurrentPath(getCurrentPath());
    }

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <strong>PETSYSTEM V3</strong>
        <span>Gestao</span>
      </div>

      <nav aria-label="Navegacao principal">
        <ul className="sidebar-navigation">
          {navigationItems.map((item) => {
            const isActive = item.href === currentPath;

            return (
              <li key={item.label}>
                <a
                  className={`sidebar-link${isActive ? ' active' : ''}${item.disabled ? ' disabled' : ''}`}
                  href={item.disabled ? undefined : item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-disabled={item.disabled || undefined}
                  onClick={item.disabled ? (event) => event.preventDefault() : undefined}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <button className="sidebar-logout" type="button" disabled>
        Sair
      </button>
    </aside>
  );
}
