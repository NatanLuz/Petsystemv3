import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPets } from "../pets/petService";
import { listServices } from "../services/serviceService";

export const appointmentStatuses = {
  scheduled: { label: "Agendado", className: "badge badge-warning" },
  confirmed: { label: "Confirmado", className: "badge badge-success" },
  cancelled: { label: "Cancelado", className: "badge badge-danger" },
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

export function toOperationalInput(value) {
  const match = String(value ?? "").match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/,
  );
  return match ? `${match[1]}T${match[2]}:${match[3] ?? "00"}` : "";
}

export function toOperationalPayload(value) {
  return toOperationalInput(value).replace("T", " ");
}

export function formatAppointmentDate(value) {
  const operational = toOperationalInput(value);
  if (!operational) return "Data indisponível";
  const [date, time] = operational.split("T");
  return `${date.split("-").reverse().join("/")} ${time.slice(0, 5)}`;
}

function getInitialFormData(appointment) {
  return {
    pet_id: appointment?.pet_id ?? "",
    service_id: appointment?.service_id ?? "",
    scheduled_at: toOperationalInput(appointment?.scheduled_at),
    status: appointment?.status ?? "scheduled",
    notes: appointment?.notes ?? "",
  };
}

export default function AppointmentForm({
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  disabled = false,
  optionsRevision = 0,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData),
  );
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

  useEffect(() => {
    setFormData(getInitialFormData(initialData));
    setValidationError(null);
  }, [initialData]);

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
    pets.length === 0 ||
    eligibleServices.length === 0;

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
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
      !pets.some((pet) => Number(pet.id) === petId) ||
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
          <span>Pet *</span>
          <select
            name="pet_id"
            value={formData.pet_id}
            onChange={handleChange}
            required
            disabled={busy || loadingPets || !!petsError || pets.length === 0}
          >
            <option value="">Selecione um pet</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} — {pet.client?.name || "Tutor indisponível"} —{" "}
                {pet.public_code ?? "Código indisponível"}
              </option>
            ))}
          </select>
        </label>
        <label className="client-field">
          <span>Serviço *</span>
          <select
            name="service_id"
            value={formData.service_id}
            onChange={handleChange}
            required
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
        </label>
        <label className="client-field">
          <span>Data/Hora *</span>
          <input
            type="datetime-local"
            name="scheduled_at"
            step="1"
            value={formData.scheduled_at}
            onChange={handleChange}
            required
            disabled={busy}
          />
        </label>
        <label className="client-field">
          <span>Status *</span>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            disabled={busy}
          >
            {Object.entries(appointmentStatuses).map(([value, status]) => (
              <option key={value} value={value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
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
      {snapshot && (
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
