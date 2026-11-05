import { useEffect, useState } from 'react';
import { ClientsPage } from './features/clients/ClientsPage';
import { ServicesPage } from './features/services/ServicesPage';
import { MainLayout } from './layouts/MainLayout';

function StructuralPage({ message }: { message: string }) {
  return (
    <section className="structural-page">
      <span className="eyebrow">PetSystem</span>
      <h2>{message}</h2>
    </section>
  );
}

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    function handleLocationChange() {
      setPathname(window.location.pathname);
    }

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  let page = <StructuralPage message="Dashboard em preparacao" />;

  if (pathname === '/clients') {
    page = <ClientsPage />;
  } else if (pathname === '/services') {
    page = <ServicesPage />;
  } else if (pathname === '/health') {
    page = <StructuralPage message="Status da API" />;
  }

  return <MainLayout>{page}</MainLayout>;
}
