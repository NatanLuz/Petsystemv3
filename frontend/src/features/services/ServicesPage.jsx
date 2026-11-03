import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/permissions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "../useDebouncedValue";
import { formatCurrency } from "../../shared/formatters.js";
import { EmptyState, ErrorState, LoadingSkeleton, Toast, useConfirmDialog } from "../../components/feedback/Feedback";
import { getPageSlice, DEFAULT_PAGE_SIZE } from "../listPagination";
import ServiceForm from "./ServiceForm";
import { filterServices } from "./serviceSearch";
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

function formatPrice(price) {
  return formatCurrency(price);
}

export default function ServicesPage() {
  const { user } = useAuth();
  const { confirm, dialog } = useConfirmDialog();
  const canCreate = can(user, "services.create");
  const canUpdate = can(user, "services.update");
  const canDelete = can(user, "services.delete");
  const canViewFinance = can(user, "dashboard.finance.view");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingService, setEditingService] = useState(null);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const operationPending = useRef(false);
  const busy = submitting || deletingServiceId !== null;

  const filteredServices = useMemo(
    () => filterServices(services, debouncedSearch),
    [services, debouncedSearch],
  );
  const servicePage = getPageSlice(filteredServices, page);

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
  }, [loadRevision]);

  function clearOperationMessages() {
    setSuccessMessage(null);
    setSubmitError(null);
    setDeleteError(null);
    setFieldErrors({});
  }

  function openForm(service = null) {
    if (!(service ? canUpdate : canCreate)) return;
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
    if (!(editingService ? canUpdate : canCreate)) return;
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
      if (requestError.response?.status === 403) {
        setSubmitError(null);
      } else if (requestError.response?.status === 422) {
        const errors = requestError.response.data?.errors;
        setFieldErrors(errors || {});
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
    if (!canDelete) return;
    if (operationPending.current) {
      return;
    }

    const hasHistory = Number(service.appointments_count || 0) + Number(service.attendances_count || 0) > 0;
    const actionText = hasHistory ? "desativar" : "excluir";
    if (!(await confirm({
      title: `${hasHistory ? 'Desativar' : 'Excluir'} serviço?`,
      message: `Deseja ${actionText} o serviço ${service.name}?${hasHistory ? ' Os agendamentos existentes serão preservados.' : ' Esta ação não pode ser desfeita.'}`,
      confirmLabel: hasHistory ? 'Desativar serviço' : 'Excluir serviço',
    }))) return;

    operationPending.current = true;
    setDeletingServiceId(service.id);
    clearOperationMessages();

    try {
      const result = await deleteService(service.id);
      if (result?.service) {
        setServices((currentServices) => currentServices.map((item) =>
          item.id === service.id ? { ...result.service, appointments_count: service.appointments_count, attendances_count: service.attendances_count } : item));
      } else {
        setServices((currentServices) => currentServices.filter((item) => item.id !== service.id));
      }

      if (editingService?.id === service.id) {
        setEditingService(null);
        setIsFormOpen(false);
      }

      setSuccessMessage(result?.service ? "Serviço desativado; o histórico foi preservado." : "Serviço excluído com sucesso.");
    } catch (requestError) {
      if (requestError.response?.status === 403) return;
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
      {dialog}
      <header className="clients-header">
        <div>
          <p>Cadastre e gerencie os serviços oferecidos pelo PetSystem.</p>
        </div>

        {canCreate && (<button
          type="button"
          className="btn btn-primary clients-new-button"
          onClick={() => openForm()}
          disabled={busy || loading || !!error}
        >
          + Novo Serviço
        </button>)}
      </header>

      <Toast message={successMessage} />

      {isFormOpen && (
        <ServiceForm
          key={formKey}
          initialData={editingService}
          fieldErrors={fieldErrors}
          onSubmit={handleSubmitService}
          onCancel={handleCancelForm}
          submitting={submitting}
          hasPermission={editingService ? canUpdate : canCreate}
        />
      )}

      {submitError && <Toast message={submitError} tone="error" />}

      {deleteError && <Toast message={deleteError} tone="error" />}

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
            onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
          />
        </div>

        {loading && <LoadingSkeleton label="Carregando serviços..." />}

        {!loading && error && <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); setLoadRevision((value) => value + 1); }} />}

        {!loading && !error && services.length === 0 && (
          <EmptyState message="Nenhum serviço cadastrado." actionLabel={canCreate ? 'Cadastrar serviço' : undefined} onAction={canCreate ? () => openForm() : undefined} />
        )}

        {!loading &&
          !error &&
          services.length > 0 &&
          filteredServices.length === 0 && (
            <EmptyState message="Nenhum serviço encontrado para esta busca." />
          )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className="clients-table-wrapper" role="region" aria-label="Tabela de serviços" tabIndex={0}>
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  {canViewFinance && <th>Preço</th>}
                  <th>Duração</th>
                  <th>Status</th>
                  {(canUpdate || canDelete) && (<th>Ações</th>)}
                </tr>
              </thead>
              <tbody>
                {servicePage.items.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    {canViewFinance && <td>{formatPrice(service.price)}</td>}
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
                    {(canUpdate || canDelete) && (<td>
                      <div className="clients-table-actions">
                        {canUpdate && (<button
                          type="button"
                          className="clients-action-button clients-action-edit"
                          onClick={() => openForm(service)}
                          disabled={busy}
                        >
                          Editar
                        </button>)}
                        {canDelete && (<button
                          type="button"
                          className="clients-action-button clients-action-delete"
                          onClick={() => handleDeleteService(service)}
                          disabled={busy}
                        >
                          {deletingServiceId === service.id
                            ? "Salvando..."
                            : Number(service.appointments_count || 0) + Number(service.attendances_count || 0) > 0 ? "Desativar" : "Excluir"}
                        </button>)}
                      </div>
                    </td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filteredServices.length > DEFAULT_PAGE_SIZE && <nav className="clients-pagination" aria-label="Paginação de serviços"><span>Mostrando {servicePage.firstItem}–{servicePage.lastItem} de {servicePage.total}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={servicePage.page === 1}>Anterior</button><span>Página {servicePage.page} de {servicePage.pageCount}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.min(servicePage.pageCount, current + 1))} disabled={servicePage.page === servicePage.pageCount}>Próxima</button></nav>}
      </section>
    </section>
  );
}
