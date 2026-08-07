import { useMemo, useState } from 'react';
import { deleteClient } from './clientService';
import { ClientForm } from './ClientForm';
import { useClients } from './useClients';
import type { ClientFilters, ClientStatus } from './types';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus | ''>('');

  const filters = useMemo<ClientFilters>(
    () => ({
      search: search || undefined,
      status,
    }),
    [search, status],
  );

  const { clients, isLoading, error, reload } = useClients(filters);

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm('Deseja remover este cliente?');

    if (!shouldDelete) {
      return;
    }

    await deleteClient(id);
    await reload();
  }

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Modulo de Clientes</span>
          <h1>Clientes</h1>
          <p>Cadastre, consulte e mantenha os tutores atendidos pelo PetSystem.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Novo cliente</h2>
            <p>Dados principais para contato e identificacao do tutor.</p>
          </div>
        </div>
        <ClientForm onCreated={reload} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Lista de clientes</h2>
            <p>Use os filtros para encontrar registros rapidamente.</p>
          </div>
        </div>

        <div className="filters">
          <input
            placeholder="Buscar por nome, telefone, e-mail ou documento"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ClientStatus | '')}
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {isLoading && <p className="state">Carregando clientes...</p>}
        {error && <p className="state error">{error}</p>}
        {!isLoading && !error && clients.length === 0 && (
          <p className="state">Nenhum cliente encontrado.</p>
        )}

        {!isLoading && !error && clients.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.phone}</td>
                    <td>{client.email ?? '-'}</td>
                    <td>
                      <span className={`badge ${client.status}`}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button className="ghost-button" onClick={() => void handleDelete(client.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
