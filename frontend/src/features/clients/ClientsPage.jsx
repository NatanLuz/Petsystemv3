import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/permissions";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../useDebouncedValue";
import { formatPhone } from "./contactFormat";
import { EmptyState, ErrorState, LoadingSkeleton, Toast, useConfirmDialog } from "../../components/feedback/Feedback";
import { getPageSlice, DEFAULT_PAGE_SIZE } from "../listPagination";
import ClientForm from "./ClientForm";
import { filterClients } from "./clientSearch";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from "./clientService";

export default function ClientsPage() {
  const { user } = useAuth();
  const { confirm, dialog } = useConfirmDialog();
  const canCreate = can(user, "clients.create");
  const canUpdate = can(user, "clients.update");
  const canDelete = can(user, "clients.delete");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdClient, setCreatedClient] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClientId, setDeletingClientId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadRevision, setLoadRevision] = useState(0);

  const filteredClients = useMemo(
    () => filterClients(clients, debouncedSearch),
    [clients, debouncedSearch],
  );
  const clientPage = getPageSlice(filteredClients, page);

  function clearOperationMessages() {
    setSuccessMessage(null);
    setSubmitError(null);
    setFieldErrors({});
    setCreatedClient(null);
    setDeleteError(null);
  }

  async function handleSubmitClient(formData) {
    if (!(editingClient ? canUpdate : canCreate)) return;
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      if (editingClient) {
        const updatedClient = await updateClient(editingClient.id, formData);

        setClients((currentClients) =>
          currentClients.map((client) =>
            client.id === editingClient.id ? updatedClient : client,
          ),
        );
        setEditingClient(null);
        setIsFormOpen(false);
        setSuccessMessage("Cliente atualizado com sucesso.");

        return;
      }

      const createdClient = await createClient(formData);

      setClients((currentClients) => [...currentClients, createdClient]);
      setCreatedClient(createdClient);
      setFormKey((currentKey) => currentKey + 1);
      setIsFormOpen(false);
      setSuccessMessage("Cliente cadastrado com sucesso.");
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setSubmitError(null);
      } else if (requestError.response?.status === 422) {
        setFieldErrors(requestError.response.data?.errors || {});
        setSubmitError("Verifique os dados informados e tente novamente.");
      } else {
        setSubmitError(
          editingClient
            ? "Não foi possível atualizar o cliente. Tente novamente mais tarde."
            : "Não foi possível cadastrar o cliente. Tente novamente mais tarde.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewClient() {
    if (!canCreate) return;
    if (submitting) {
      return;
    }

    clearOperationMessages();
    setEditingClient(null);
    setFormKey((currentKey) => currentKey + 1);
    setIsFormOpen(true);
  }

  function handleEditClient(client) {
    if (!canUpdate) return;
    if (submitting) {
      return;
    }

    clearOperationMessages();
    setEditingClient(client);
    setIsFormOpen(true);
  }

  function handleCancelForm() {
    if (submitting) {
      return;
    }

    setEditingClient(null);
    setIsFormOpen(false);
    setSubmitError(null);
  }

  async function handleDeleteClient(client) {
    if (!canDelete) return;
    if (submitting || deletingClientId !== null) {
      return;
    }

    const confirmed = await confirm({ title: 'Excluir cliente?', message: `Deseja realmente excluir o cliente ${client.name}?` });

    if (!confirmed) {
      return;
    }

    setDeletingClientId(client.id);
    setDeleteError(null);
    setSuccessMessage(null);

    try {
      await deleteClient(client.id);

      setClients((currentClients) =>
        currentClients.filter((currentClient) => currentClient.id !== client.id),
      );

      if (editingClient?.id === client.id) {
        setEditingClient(null);
        setIsFormOpen(false);
        setSubmitError(null);
      }

      setSuccessMessage("Cliente excluído com sucesso.");
    } catch (requestError) {
      if (requestError.response?.status === 403) return;
      setDeleteError(
        "Não foi possível excluir o cliente. Tente novamente mais tarde.",
      );
    } finally {
      setDeletingClientId(null);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      try {
        const data = await listClients();

        if (isMounted) {
          setClients(data);
        }
      } catch {
        if (isMounted) {
          setError(
            "Não foi possível carregar os clientes. Tente novamente mais tarde.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [loadRevision]);

  return (
    <section className="clients-page">
      {dialog}
      <header className="clients-header">
        <div>
          <p>Cadastre e gerencie os clientes do PetSystem.</p>
        </div>

        {canCreate && (<button
          type="button"
          className="btn btn-primary clients-new-button"
          onClick={handleNewClient}
          disabled={submitting}
        >
          + Novo Cliente
        </button>)}
      </header>

      {successMessage && (
        <>
          <Toast message={successMessage} />
          {createdClient && <div className="client-follow-up-actions">
            <Link className="btn btn-primary" to={`/pets?client_id=${createdClient.id}`}>Cadastrar o primeiro pet</Link>
            <Link className="btn btn-secondary" to={`/clients/${createdClient.id}`}>Abrir ficha do cliente</Link>
          </div>}
        </>
      )}

      {isFormOpen && (editingClient ? canUpdate : canCreate) && (
        <ClientForm
          key={editingClient ? `edit-${editingClient.id}` : `create-${formKey}`}
          initialData={editingClient}
          onSubmit={handleSubmitClient}
          onCancel={handleCancelForm}
          submitting={submitting}
          fieldErrors={fieldErrors}
        />
      )}

      {submitError && <Toast message={submitError} tone="error" />}

      {deleteError && <Toast message={deleteError} tone="error" />}

      <section className="clients-panel">
        <div className="clients-toolbar">
          <label className="clients-search-label" htmlFor="client-search">
            Buscar clientes
          </label>
          <input
            id="client-search"
            className="clients-search-input"
            type="search"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchTerm}
            onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
          />
        </div>

        {loading && <LoadingSkeleton label="Carregando clientes..." />}

        {error && !loading && (
          <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); setLoadRevision((value) => value + 1); }} />
        )}

        {!loading && !error && clients.length === 0 && (
          <EmptyState message="Nenhum cliente cadastrado." actionLabel={canCreate ? 'Cadastrar cliente' : undefined} onAction={canCreate ? handleNewClient : undefined} />
        )}

        {!loading &&
          !error &&
          clients.length > 0 &&
          filteredClients.length === 0 && (
            <EmptyState message="Nenhum cliente encontrado para esta busca." />
          )}

        {!loading && !error && filteredClients.length > 0 && (
          <div className="clients-table-wrapper" role="region" aria-label="Tabela de clientes" tabIndex={0}>
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Endereço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientPage.items.map((client) => (
                  <tr key={client.id}>
                    <td><Link to={`/clients/${client.id}`}>{client.name}</Link></td>
                    <td>{client.email || "Não informado"}</td>
                    <td>{client.phone ? formatPhone(client.phone) : "Não informado"}</td>
                    <td>{client.address || "Não informado"}</td>
                    <td>
                      <div className="clients-table-actions">
                        {canUpdate && (<button
                          type="button"
                          className="clients-action-button clients-action-edit"
                          onClick={() => handleEditClient(client)}
                          disabled={submitting || deletingClientId !== null}
                        >
                          Editar
                        </button>)}
                        {canDelete && (<button
                          type="button"
                          className="clients-action-button clients-action-delete"
                          onClick={() => handleDeleteClient(client)}
                          disabled={submitting || deletingClientId !== null}
                        >
                          {deletingClientId === client.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filteredClients.length > DEFAULT_PAGE_SIZE && (
          <nav className="clients-pagination" aria-label="Paginação de clientes">
            <span>Mostrando {clientPage.firstItem}–{clientPage.lastItem} de {clientPage.total}</span>
            <button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={clientPage.page === 1}>Anterior</button>
            <span>Página {clientPage.page} de {clientPage.pageCount}</span>
            <button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.min(clientPage.pageCount, current + 1))} disabled={clientPage.page === clientPage.pageCount}>Próxima</button>
          </nav>
        )}
      </section>
    </section>
  );
}
