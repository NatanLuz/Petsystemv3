import { useMemo, useState } from 'react';
import { deleteClient } from './clientService';
import { ClientForm } from './ClientForm';
import { useClients } from './useClients';
import type { Client, ClientFilters, ClientStatus } from './types';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus | ''>('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

    try {
      setDeletingClientId(id);
      setFeedback(null);
      setDeleteError(null);
      await deleteClient(id);
      await reload();
      setFeedback('Cliente excluido com sucesso.');
      if (editingClient?.id === id) {
        handleCloseForm();
      }
    } catch {
      setDeleteError('Nao foi possivel remover o cliente.');
    } finally {
      setDeletingClientId(null);
    }
  }

  function handleNewClient() {
    setFeedback(null);
    setDeleteError(null);
    setEditingClient(null);
    setIsFormVisible((current) => !current);
  }

  function handleEdit(client: Client) {
    setFeedback(null);
    setDeleteError(null);
    setEditingClient(client);
    setIsFormVisible(true);
  }

  function handleCloseForm() {
    setEditingClient(null);
    setIsFormVisible(false);
  }

  async function handleSaved(action: 'created' | 'updated') {
    await reload();
    setEditingClient(null);
    setIsFormVisible(false);
    setFeedback(
      action === 'created'
        ? 'Cliente cadastrado com sucesso.'
        : 'Cliente atualizado com sucesso.',
    );
  }

  return (
    <main className="page clients-page">
      <section className="page-header clients-header">
        <div>
          <h1>Gerenciar Clientes</h1>
          <p>Cadastre e gerencie os clientes do PetSystem.</p>
        </div>
        <button className="primary-button" type="button" onClick={handleNewClient}>
          Novo Cliente
        </button>
      </section>

      {feedback && <p className="feedback success">{feedback}</p>}
      {deleteError && <p className="feedback error">{deleteError}</p>}

      {isFormVisible && (
        <section className="panel clients-form-panel">
          <div className="panel-header">
            <div>
              <h2>{editingClient ? 'Editar cliente' : 'Novo cliente'}</h2>
              <p>
                {editingClient
                  ? 'Atualize os dados principais do cliente.'
                  : 'Informe os dados principais para cadastrar um cliente.'}
              </p>
            </div>
          </div>
          <ClientForm client={editingClient} onCancel={handleCloseForm} onSaved={handleSaved} />
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Lista de clientes</h2>
            <p>Use os filtros para encontrar registros rapidamente.</p>
          </div>
        </div>

        <div className="filters">
          <input
            placeholder="Buscar por nome, telefone ou e-mail"
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
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Endereco</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.email ?? '-'}</td>
                    <td>{client.phone}</td>
                    <td>{client.address ?? '-'}</td>
                    <td className="table-actions">
                      <button
                        className="edit-button"
                        type="button"
                        onClick={() => handleEdit(client)}
                      >
                        Editar
                      </button>
                      <button
                        className="delete-button"
                        disabled={deletingClientId === client.id}
                        type="button"
                        onClick={() => void handleDelete(client.id)}
                      >
                        {deletingClientId === client.id ? 'Excluindo...' : 'Excluir'}
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
