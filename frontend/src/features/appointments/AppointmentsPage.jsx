import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/permissions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../useDebouncedValue";
import { getPageSlice, DEFAULT_PAGE_SIZE } from "../listPagination";
import AppointmentForm, { appointmentStatuses, formatAppointmentDate, formatAppointmentPrice } from "./AppointmentForm";
import { filterAppointments, filterAppointmentsByDate } from "./appointmentSearch";
import { createAppointment, deleteAppointment, listAppointments, updateAppointment } from "./appointmentService";

const fieldLabels = {
  pet_id: "Pet", service_id: "Serviço", scheduled_at: "Data/Hora",
  status: "Status", notes: "Observações", cancellation_reason: "Motivo", reschedule_reason: "Motivo do reagendamento",
};

function validationMessage(error) {
  const data = error.response?.data;
  const messages = Object.entries(fieldLabels).flatMap(([field, label]) => {
    const errors = data?.errors?.[field];
    return Array.isArray(errors) ? errors.filter((message) => typeof message === "string").map((message) => `${label}: ${message}`) : [];
  });
  const summary = typeof data?.message === "string" ? data.message : "Verifique os dados informados.";
  const serviceHint = data?.errors?.service_id ? " Revise o Serviço: para criar ou trocar, selecione um serviço ativo." : "";
  return `${summary} ${messages.join(" ")}${serviceHint}`.trim();
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const canCreate = can(user, "appointments.create");
  const canUpdate = can(user, "appointments.update");
  const canDelete = can(user, "appointments.delete");
  const canStartAttendance = can(user, "attendances.create");
  const canViewFinance = can(user, "dashboard.finance.view");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [optionsRevision, setOptionsRevision] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = searchParams.get('date') || '';
  const operationPending = useRef(false);
  const busy = submitting || deletingId !== null;

  const filteredAppointments = useMemo(
    () => filterAppointmentsByDate(filterAppointments(appointments, debouncedSearch, appointmentStatuses), dateFilter),
    [appointments, debouncedSearch, dateFilter],
  );
  const appointmentPage = getPageSlice(filteredAppointments, page);

  useEffect(() => {
    let active = true;
    listAppointments().then((data) => {
      if (active) setAppointments(data);
    }).catch(() => {
      if (active) setError("Não foi possível carregar os agendamentos. Tente novamente mais tarde.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function clearMessages() {
    setSubmitError(null);
    setFieldErrors({});
    setDeleteError(null);
    setSuccessMessage(null);
  }

  function openForm(appointment = null) {
    if (!(appointment ? canUpdate : canCreate)) return;
    if (operationPending.current) return;
    clearMessages();
    setEditingAppointment(appointment);
    setFormKey((key) => key + 1);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (operationPending.current) return;
    setEditingAppointment(null);
    setIsFormOpen(false);
    setSubmitError(null);
  }

  async function handleSubmit(data) {
    if (!(editingAppointment ? canUpdate : canCreate)) return;
    if (operationPending.current) return;
    operationPending.current = true;
    setSubmitting(true);
    clearMessages();
    try {
      const saved = editingAppointment
        ? await updateAppointment(editingAppointment.id, data)
        : await createAppointment(data);
      setAppointments((current) => editingAppointment
        ? current.map((appointment) => appointment.id === editingAppointment.id ? saved : appointment)
        : [...current, saved]);
      setSuccessMessage(editingAppointment ? "Agendamento atualizado com sucesso." : "Agendamento cadastrado com sucesso.");
      setEditingAppointment(null);
      setIsFormOpen(false);
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setSubmitError(null);
      } else if (requestError.response?.status === 422) {
        setFieldErrors(requestError.response.data?.errors || {});
        setSubmitError(validationMessage(requestError));
        setOptionsRevision((value) => value + 1);
      } else if (requestError.response?.status === 404) {
        setSubmitError("O agendamento ou um registro relacionado não foi encontrado. Atualize a página para conferir os registros disponíveis.");
      } else {
        setSubmitError("Não foi possível salvar o agendamento. Tente novamente mais tarde.");
      }
    } finally {
      operationPending.current = false;
      setSubmitting(false);
    }
  }

  async function handleDelete(appointment) {
    if (!canDelete) return;
    if (operationPending.current) return;
    if (!window.confirm(`Excluir definitivamente o agendamento de ${appointment.pet?.name || "pet indisponível"} em ${formatAppointmentDate(appointment.scheduled_at)}? Esta ação não pode ser desfeita. Para apenas cancelar, edite o status para Cancelado.`)) return;
    operationPending.current = true;
    setDeletingId(appointment.id);
    clearMessages();
    try {
      await deleteAppointment(appointment.id);
      setAppointments((current) => current.filter((item) => item.id !== appointment.id));
      if (editingAppointment?.id === appointment.id) {
        setEditingAppointment(null);
        setIsFormOpen(false);
      }
      setSuccessMessage("Agendamento excluído com sucesso.");
    } catch (requestError) {
      if (requestError.response?.status === 403) return;
      setDeleteError(requestError.response?.status === 404
        ? "O agendamento não foi encontrado. Atualize a página para conferir a lista."
        : "Não foi possível excluir o agendamento. Tente novamente mais tarde.");
    } finally {
      operationPending.current = false;
      setDeletingId(null);
    }
  }

  return (
    <section className="clients-page">
      <header className="clients-header">
        <div><p>Cadastre e gerencie os agendamentos do PetSystem.</p></div>
        {canCreate && (<button type="button" className="btn btn-primary clients-new-button" onClick={() => openForm()} disabled={busy || loading || !!error}>+ Novo Agendamento</button>)}
      </header>
      {successMessage && <div className="clients-feedback clients-feedback-success" role="status">{successMessage}</div>}
      {isFormOpen && (editingAppointment ? canUpdate : canCreate) && <AppointmentForm key={formKey} initialData={editingAppointment} onSubmit={handleSubmit} onCancel={closeForm} submitting={submitting} disabled={deletingId !== null} optionsRevision={optionsRevision} fieldErrors={fieldErrors} />}
      {submitError && <div className="clients-feedback clients-feedback-error" role="alert">{submitError}</div>}
      {deleteError && <div className="clients-feedback clients-feedback-error" role="alert">{deleteError}</div>}
      <section className="clients-panel">
        <div className="clients-toolbar">
          <label className="clients-search-label" htmlFor="appointment-search">Buscar agendamentos</label>
          <input id="appointment-search" className="clients-search-input" type="search" placeholder="Buscar por pet, tutor, código, serviço, status ou data..." value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} />
          <label className="clients-search-label" htmlFor="appointment-date-filter">Data</label>
          <input id="appointment-date-filter" className="clients-search-input" type="date" value={dateFilter} onChange={(event) => {
            const next = new URLSearchParams(searchParams);
            if (event.target.value) next.set('date', event.target.value); else next.delete('date');
            setSearchParams(next, { replace: true });
          }} />
        </div>
        {loading && <div className="clients-state" role="status">Carregando agendamentos...</div>}
        {!loading && error && <div className="clients-state clients-state-error" role="alert">{error}</div>}
        {!loading && !error && appointments.length === 0 && <div className="clients-state">Nenhum agendamento cadastrado.</div>}
        {!loading && !error && appointments.length > 0 && filteredAppointments.length === 0 && <div className="clients-state">Nenhum agendamento encontrado para esta busca.</div>}
        {!loading && !error && filteredAppointments.length > 0 && <div className="clients-table-wrapper" role="region" aria-label="Tabela de agendamentos" tabIndex={0}>
          <table className="clients-table">
            <thead><tr><th>Data/Hora</th><th>Pet</th><th>Tutor</th><th>Serviço</th>{canViewFinance && <th>Valor</th>}<th>Status</th><th>Ações</th></tr></thead>
            <tbody>{appointmentPage.items.map((appointment) => (
              <tr key={appointment.id}>
                <td>{formatAppointmentDate(appointment.scheduled_at)}</td>
                <td>{appointment.pet?.name || "Pet indisponível"}</td>
                <td>{appointment.pet?.client?.name || "Tutor indisponível"}</td>
                <td>{appointment.service?.name || "Serviço indisponível"}</td>
                {canViewFinance && <td>{formatAppointmentPrice(appointment.price)}</td>}
                <td><span className={appointmentStatuses[appointment.status]?.className || "badge"}>{appointmentStatuses[appointment.status]?.label || "Status indisponível"}</span></td>
                <td><div className="clients-table-actions">
                  {canUpdate && (<button type="button" className="clients-action-button clients-action-edit" onClick={() => openForm(appointment)} disabled={busy}>Editar</button>)}
                  {canStartAttendance && appointment.status === "confirmed" && <Link className="clients-action-button clients-action-edit" to={`/attendances?appointment_id=${appointment.id}`}>Iniciar atendimento</Link>}
                  {canDelete && (<button type="button" className="clients-action-button clients-action-delete" onClick={() => handleDelete(appointment)} disabled={busy}>{deletingId === appointment.id ? "Excluindo..." : "Excluir"}</button>)}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
        {!loading && !error && filteredAppointments.length > DEFAULT_PAGE_SIZE && <nav className="clients-pagination" aria-label="Paginação de agendamentos"><span>Mostrando {appointmentPage.firstItem}–{appointmentPage.lastItem} de {appointmentPage.total}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={appointmentPage.page === 1}>Anterior</button><span>Página {appointmentPage.page} de {appointmentPage.pageCount}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.min(appointmentPage.pageCount, current + 1))} disabled={appointmentPage.page === appointmentPage.pageCount}>Próxima</button></nav>}
      </section>
    </section>
  );
}
