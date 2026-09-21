import React, { useEffect, useMemo, useState } from "react";
import ClientForm from "./ClientForm";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from "./clientService";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClientId, setDeletingClientId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.email, client.phone].some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [clients, searchTerm]);

  function clearOperationMessages() {
    setSuccessMessage(null);
    setSubmitError(null);
    setDeleteError(null);
  }

  async function handleSubmitClient(formData) {
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
      setFormKey((currentKey) => currentKey + 1);
      setIsFormOpen(false);
      setSuccessMessage("Cliente cadastrado com sucesso.");
    } catch (requestError) {
      if (requestError.response?.status === 422) {
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
    if (submitting) {
      return;
    }

    clearOperationMessages();
    setEditingClient(null);
    setFormKey((currentKey) => currentKey + 1);
    setIsFormOpen(true);
  }

  function handleEditClient(client) {
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
    if (submitting || deletingClientId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir o cliente ${client.name}?`,
    );

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
    } catch {
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
  }, []);

  return (
    <section className="clients-page">
      <header className="clients-header">
        <div>
          <p>Cadastre e gerencie os clientes do PetSystem.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary clients-new-button"
          onClick={handleNewClient}
          disabled={submitting}
        >
          + Novo Cliente
        </button>
      </header>

      {successMessage && (
        <div className="clients-feedback clients-feedback-success" role="status">
          {successMessage}
        </div>
      )}

      {isFormOpen && (
        <ClientForm
          key={editingClient ? `edit-${editingClient.id}` : `create-${formKey}`}
          initialData={editingClient}
          onSubmit={handleSubmitClient}
          onCancel={handleCancelForm}
          submitting={submitting}
        />
      )}

      {submitError && (
        <div className="clients-feedback clients-feedback-error" role="alert">
          {submitError}
        </div>
      )}

      {deleteError && (
        <div className="clients-feedback clients-feedback-error" role="alert">
          {deleteError}
        </div>
      )}

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
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {loading && <div className="clients-state">Carregando clientes...</div>}

        {error && !loading && (
          <div className="clients-state clients-state-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && clients.length === 0 && (
          <div className="clients-state">Nenhum cliente cadastrado.</div>
        )}

        {!loading &&
          !error &&
          clients.length > 0 &&
          filteredClients.length === 0 && (
            <div className="clients-state">
              Nenhum cliente encontrado para esta busca.
            </div>
          )}

        {!loading && !error && filteredClients.length > 0 && (
          <div className="clients-table-wrapper">
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
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.email || "Não informado"}</td>
                    <td>{client.phone || "Não informado"}</td>
                    <td>{client.address || "Não informado"}</td>
                    <td>
                      <div className="clients-table-actions">
                        <button
                          type="button"
                          className="clients-action-button clients-action-edit"
                          onClick={() => handleEditClient(client)}
                          disabled={submitting || deletingClientId !== null}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="clients-action-button clients-action-delete"
                          onClick={() => handleDeleteClient(client)}
                          disabled={submitting || deletingClientId !== null}
                        >
                          {deletingClientId === client.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
