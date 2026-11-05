const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Gerenciar Clientes',
  '/services': 'Serviços',
  '/health': 'Status da API',
};

type TopbarProps = {
  pathname: string;
};

export function Topbar({ pathname }: TopbarProps) {
  return (
    <header className="app-topbar">
      <h1>{pageTitles[pathname] ?? 'PetSystem'}</h1>
      <div className="topbar-user" aria-label="Usuario atual">
        <strong>Administrador</strong>
        <span>Admin</span>
      </div>
    </header>
  );
}
