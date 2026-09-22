import React, { useEffect, useMemo, useRef, useState } from "react";
import ServiceForm from "./ServiceForm";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "./serviceService";

const fieldLabels = {
  name: "Nome",
  description: "Descrição",
  price: "Preço",
  duration_minutes: "Duração",
  active: "Status",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(price) {
  const numericPrice = Number(price);

  return Number.isFinite(numericPrice)
    ? currencyFormatter.format(numericPrice)
    : "Não informado";
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const operationPending = useRef(false);
  const busy = submitting || deletingServiceId !== null;

  const filteredServices = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return services;
    }

    return services.filter((service) =>
      [service.name, service.description].some((value) =>
        String(value ?? "").toLowerCase().includes(search),
      ),
    );
  }, [services, searchTerm]);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        const data = await listServices();

        if (active) {
          setServices(data);
        }
      } catch {
        if (active) {
          setError(
            "Não foi possível carregar os serviços. Tente novamente mais tarde.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  function clearOperationMessages() {
    setSuccessMessage(null);
    setSubmitError(null);
    setDeleteError(null);
  }

  function openForm(service = null) {
    if (operationPending.current) {
      return;
    }

    clearOperationMessages();
    setEditingService(service);
    setFormKey((key) => key + 1);
    setIsFormOpen(true);
  }

  function handleCancelForm() {
    if (operationPending.current) {
      return;
    }

    setEditingService(null);
    setIsFormOpen(false);
    setSubmitError(null);
  }

  async function handleSubmitService(data) {
    if (operationPending.current) {
      return;
    }

    operationPending.current = true;
    setSubmitting(true);
    clearOperationMessages();

    try {
      const savedService = editingService
        ? await updateService(editingService.id, data)
        : await createService(data);

      setServices((currentServices) =>
        editingService
          ? currentServices.map((service) =>
              service.id === editingService.id ? savedService : service,
            )
          : [...currentServices, savedService],
      );
      setSuccessMessage(
        editingService
          ? "Serviço atualizado com sucesso."
          : "Serviço cadastrado com sucesso.",
      );
      setEditingService(null);
      setIsFormOpen(false);
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        const errors = requestError.response.data?.errors;
        const fields = Object.keys(fieldLabels)
          .filter((field) => errors?.[field])
          .map((field) => fieldLabels[field]);

        setSubmitError(
          fields.length
            ? `Verifique os campos: ${fields.join(", ")}. Corrija os dados e tente novamente.`
            : "Verifique os dados informados e tente novamente.",
        );
      } else {
        setSubmitError(
          editingService
            ? "Não foi possível atualizar o serviço. Tente novamente mais tarde."
            : "Não foi possível cadastrar o serviço. Tente novamente mais tarde.",
        );
      }
    } finally {
      operationPending.current = false;
      setSubmitting(false);
    }
  }

  async function handleDeleteService(service) {
    if (operationPending.current) {
      return;
    }

    if (!window.confirm(`Deseja realmente excluir o serviço ${service.name}?`)) {
      return;
    }

    operationPending.current = true;
    setDeletingServiceId(service.id);
    clearOperationMessages();

    try {
      await deleteService(service.id);
      setServices((currentServices) =>
        currentServices.filter((item) => item.id !== service.id),
      );

      if (editingService?.id === service.id) {
        setEditingService(null);
        setIsFormOpen(false);
      }

      setSuccessMessage("Serviço excluído com sucesso.");
    } catch {
      setDeleteError(
        "Não foi possível excluir o serviço. Tente novamente mais tarde.",
      );
    } finally {
      operationPending.current = false;
      setDeletingServiceId(null);
    }
  }

  return (
    <section className="clients-page">
      <header className="clients-header">
        <div>
          <p>Cadastre e gerencie os serviços oferecidos pelo PetSystem.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary clients-new-button"
          onClick={() => openForm()}
          disabled={busy || loading || !!error}
        >
          + Novo Serviço
        </button>
      </header>

      {successMessage && (
        <div className="clients-feedback clients-feedback-success" role="status">
          {successMessage}
        </div>
      )}

      {isFormOpen && (
        <ServiceForm
          key={formKey}
          initialData={editingService}
          onSubmit={handleSubmitService}
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
          <label className="clients-search-label" htmlFor="service-search">
            Buscar serviços
          </label>
          <input
            id="service-search"
            className="clients-search-input"
            type="search"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {loading && (
          <div className="clients-state" role="status">
            Carregando serviços...
          </div>
        )}

        {!loading && error && (
          <div className="clients-state clients-state-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="clients-state">Nenhum serviço cadastrado.</div>
        )}

        {!loading &&
          !error &&
          services.length > 0 &&
          filteredServices.length === 0 && (
            <div className="clients-state">
              Nenhum serviço encontrado para esta busca.
            </div>
          )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className="clients-table-wrapper">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{formatPrice(service.price)}</td>
                    <td>{service.duration_minutes} min</td>
                    <td>
                      <span
                        className={
                          service.active
                            ? "badge badge-success"
                            : "badge badge-warning"
                        }
                      >
                        {service.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="clients-table-actions">
                        <button
                          type="button"
                          className="clients-action-button clients-action-edit"
                          onClick={() => openForm(service)}
                          disabled={busy}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="clients-action-button clients-action-delete"
                          onClick={() => handleDeleteService(service)}
                          disabled={busy}
                        >
                          {deletingServiceId === service.id
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
