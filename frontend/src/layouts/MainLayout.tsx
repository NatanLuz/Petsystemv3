import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    function handleLocationChange() {
      setPathname(window.location.pathname);
    }

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar pathname={pathname} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
