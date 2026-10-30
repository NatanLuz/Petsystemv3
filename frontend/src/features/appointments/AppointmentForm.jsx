import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/permissions";
import { getClinicDateTime } from "../../pages/dashboardMetrics";
import {
  formatAppointmentDate,
  toOperationalInput,
  toOperationalPayload,
} from "./appointmentDateTime";
import { listPets } from "../pets/petService";
import { listServices } from "../services/serviceService";

export { formatAppointmentDate, toOperationalInput, toOperationalPayload };

export const appointmentStatuses = {
  scheduled: { label: "Agendado", className: "badge badge-warning" },
  confirmed: { label: "Confirmado", className: "badge badge-success" },
  in_progress: { label: "Em atendimento", className: "badge badge-info" },
  completed: { label: "Concluído", className: "badge badge-success" },
  cancelled: { label: "Cancelado", className: "badge badge-danger" },
  no_show: { label: "Faltou", className: "badge badge-danger" },
};

const appointmentTransitions = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["cancelled", "no_show"],
  in_progress: [],
  completed: [], cancelled: [], no_show: [],
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatAppointmentPrice(value) {
  const price = Number(value);
  return value !== null && value !== undefined && Number.isFinite(price)
    ? currencyFormatter.format(price)
    : "Não informado";
}

function getInitialFormData(appointment, defaultClientId = "", defaultPetId = "") {
  return {
    client_id: appointment?.pet?.client_id ?? defaultClientId,
    pet_id: appointment?.pet_id ?? defaultPetId,
    service_id: appointment?.service_id ?? "",
    scheduled_at: toOperationalInput(appointment?.scheduled_at),
    status: appointment?.status ?? "scheduled",
    notes: appointment?.notes ?? "",
    cancellation_reason: appointment?.cancellation_reason ?? "",
    reschedule_reason: appointment?.reschedule_reason ?? "",
  };
}

export default function AppointmentForm({
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  disabled = false,
  optionsRevision = 0,
  fieldErrors = {},
}) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const canViewFinance = can(user, "dashboard.finance.view");
  const isAdmin = user?.role === "admin";
  const minimumScheduledAt = isAdmin ? undefined : getClinicDateTime().slice(0, 16).replace(" ", "T");
  const defaultClientId = searchParams.get("client_id") ?? "";
  const defaultPetId = searchParams.get("pet_id") ?? "";
  const [formData, setFormData] = useState(() => getInitialFormData(initialData, defaultClientId, defaultPetId));
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [petsError, setPetsError] = useState(null);
  const [servicesError, setServicesError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [retry, setRetry] = useState(0);
  const isEditing = initialData !== null;
  const busy = submitting || disabled;
  const errorFor = (field) => fieldErrors[field]?.[0];

  useEffect(() => {
    setFormData(getInitialFormData(initialData, defaultClientId, defaultPetId));
    setValidationError(null);
  }, [initialData, defaultClientId, defaultPetId]);

  useEffect(() => {
    let active = true;
    setLoadingPets(true);
    setLoadingServices(true);
    setPetsError(null);
    setServicesError(null);
    listPets()
      .then((data) => {
        if (active) setPets(data);
      })
      .catch(() => {
        if (active)
          setPetsError("Não foi possível carregar os pets. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoadingPets(false);
      });
    listServices()
      .then((data) => {
        if (active) setServices(data);
      })
      .catch(() => {
        if (active)
          setServicesError(
            "Não foi possível carregar os serviços. Tente novamente.",
          );
      })
      .finally(() => {
        if (active) setLoadingServices(false);
      });
    return () => {
      active = false;
    };
  }, [optionsRevision, retry]);

  const eligibleServices = services.filter(
    (service) =>
      service.active === true ||
      (isEditing && Number(service.id) === Number(initialData.service_id)),
  );
  const availableClients = [...new Map(pets.filter((pet) => pet.client).map((pet) => [pet.client.id, pet.client])).values()];
  const eligiblePets = pets.filter((pet) => !formData.client_id || Number(pet.client_id) === Number(formData.client_id));
  const selectedService = eligibleServices.find(
    (service) => Number(service.id) === Number(formData.service_id),
  );
  const keepingService =
    isEditing && Number(formData.service_id) === Number(initialData.service_id);
  const snapshot = keepingService ? initialData : selectedService;
  const unavailable =
    loadingPets ||
    loadingServices ||
    !!petsError ||
    !!servicesError ||
    eligiblePets.length === 0 ||
    eligibleServices.length === 0;
  const currentStatus = initialData?.status ?? "scheduled";
  const allowedStatuses = new Set(isEditing
    ? [currentStatus, ...(appointmentTransitions[currentStatus] ?? [])]
    : ["scheduled"]);
  const scheduleChanged = !!initialData && formData.scheduled_at !== toOperationalInput(initialData.scheduled_at);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value, ...(name === 'client_id' ? { pet_id: '' } : {}) }));
    setValidationError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (busy || unavailable) return;
    const petId = Number(formData.pet_id);
    const serviceId = Number(formData.service_id);
    const scheduledAt = toOperationalPayload(formData.scheduled_at);
    if (
      !Number.isInteger(petId) ||
      !eligiblePets.some((pet) => Number(pet.id) === petId) ||
      !Number.isInteger(serviceId) ||
      !selectedService ||
      !scheduledAt ||
      !Object.hasOwn(appointmentStatuses, formData.status)
    ) {
      setValidationError(
        "Selecione Pet e Serviço disponíveis e informe Data/Hora e Status válidos.",
      );
      return;
    }
    onSubmit({
      pet_id: petId,
      service_id: serviceId,
      scheduled_at: scheduledAt,
      status: formData.status,
      notes: formData.notes.trim() || null,
      cancellation_reason: formData.cancellation_reason.trim() || null,
      reschedule_reason: formData.reschedule_reason.trim() || null,
    });
  }

  return (
    <form className="client-form-panel" onSubmit={handleSubmit}>
      <div className="client-form-header">
        <h3>{isEditing ? "Editar Agendamento" : "Novo Agendamento"}</h3>
        <p>
          Selecione o pet, o serviço e o horário operacional do agendamento.
        </p>
      </div>
      {loadingPets && <p role="status">Carregando pets...</p>}
      {loadingServices && <p role="status">Carregando serviços...</p>}
      {petsError && (
        <p className="clients-state-error" role="alert">
          {petsError}
        </p>
      )}
      {servicesError && (
        <p className="clients-state-error" role="alert">
          {servicesError}
        </p>
      )}
      {(petsError || servicesError) && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || loadingPets || loadingServices}
          onClick={() => setRetry((value) => value + 1)}
        >
          Tentar novamente
        </button>
      )}
      {!loadingPets && !petsError && pets.length === 0 && (
        <p role="status">
          É necessário <Link to="/pets">cadastrar um Pet</Link> antes de criar
          um agendamento.
        </p>
      )}
      {!loadingServices && !servicesError && eligibleServices.length === 0 && (
        <p role="status">
          É necessário possuir um <Link to="/services">Serviço ativo</Link> para
          agendar.
        </p>
      )}
      {validationError && (
        <p className="clients-state-error" role="alert">
          {validationError}
        </p>
      )}
      <div className="client-form-grid">
        <label className="client-field">
          <span>Cliente</span>
          <select name="client_id" value={formData.client_id} onChange={handleChange} disabled={busy || loadingPets || !!petsError}>
            <option value="">Todos os clientes</option>
            {availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="client-field">
          <span>Pet *</span>
          <select
            name="pet_id"
            value={formData.pet_id}
            onChange={handleChange}
            required
            aria-invalid={!!errorFor("pet_id")}
            disabled={busy || loadingPets || !!petsError || eligiblePets.length === 0}
          >
            <option value="">Selecione um pet</option>
            {eligiblePets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} — {pet.client?.name || "Tutor indisponível"} —{" "}
                {pet.public_code ?? "Código indisponível"}
              </option>
            ))}
          </select>
          {errorFor("pet_id") && <span className="client-field-error" role="alert">{errorFor("pet_id")}</span>}
        </label>
        <label className="client-field">
          <span>Serviço *</span>
          <select
            name="service_id"
            value={formData.service_id}
            onChange={handleChange}
            required
            aria-invalid={!!errorFor("service_id")}
            disabled={
              busy ||
              loadingServices ||
              !!servicesError ||
              eligibleServices.length === 0
            }
          >
            <option value="">Selecione um serviço</option>
            {eligibleServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
                {service.active === true ? "" : " — Inativo (serviço atual)"}
              </option>
            ))}
          </select>
          {errorFor("service_id") && <span className="client-field-error" role="alert">{errorFor("service_id")}</span>}
        </label>
        <label className="client-field">
          <span>Data/Hora *</span>
          <input
            type="datetime-local"
            name="scheduled_at"
            step="1"
            value={formData.scheduled_at}
            min={minimumScheduledAt}
            onChange={handleChange}
            required
            aria-invalid={!!errorFor("scheduled_at")}
            disabled={busy}
          />
          {errorFor("scheduled_at") && <span className="client-field-error" role="alert">{errorFor("scheduled_at")}</span>}
        </label>
        <label className="client-field">
          <span>Status *</span>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            aria-invalid={!!errorFor("status")}
            disabled={busy}
          >
            {Object.entries(appointmentStatuses).filter(([value]) => allowedStatuses.has(value)).map(([value, status]) => (
              <option key={value} value={value}>
                {status.label}
              </option>
            ))}
          </select>
          {errorFor("status") && <span className="client-field-error" role="alert">{errorFor("status")}</span>}
        </label>
        {(formData.status === "cancelled" || formData.status === "no_show") && (
          <label className="client-field">
            <span>{formData.status === "no_show" ? "Motivo da falta *" : "Motivo do cancelamento *"}</span>
            <textarea name="cancellation_reason" value={formData.cancellation_reason} onChange={handleChange} rows={2} maxLength={2000} required disabled={busy} />
            {errorFor("cancellation_reason") && <span className="client-field-error" role="alert">{errorFor("cancellation_reason")}</span>}
          </label>
        )}
        {scheduleChanged && (
          <label className="client-field">
            <span>Motivo do reagendamento *</span>
            <textarea name="reschedule_reason" value={formData.reschedule_reason} onChange={handleChange} rows={2} maxLength={2000} required disabled={busy} />
            {errorFor("reschedule_reason") && <span className="client-field-error" role="alert">{errorFor("reschedule_reason")}</span>}
          </label>
        )}
        <label className="client-field">
          <span>Observações</span>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            disabled={busy}
          />
        </label>
      </div>
      {snapshot && canViewFinance && (
        <div role="status">
          <p>
            {keepingService
              ? "Valores registrados no agendamento:"
              : "Valores do serviço que serão aplicados ao salvar:"}
          </p>
          <p>
            Preço: {formatAppointmentPrice(snapshot.price)} · Duração:{" "}
            {snapshot.duration_minutes} min
          </p>
        </div>
      )}
      <div className="client-form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || unavailable}
        >
          {submitting
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Salvar Agendamento"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
