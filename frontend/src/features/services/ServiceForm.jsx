import React, { useEffect, useState } from "react";

function getInitialFormData(service) {
  return {
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service?.price ?? "",
    duration_minutes: service?.duration_minutes ?? "",
    active: service?.active ?? true,
  };
}

function formatPriceForPayload(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return numericValue.toFixed(2);
}

export default function ServiceForm({
  onSubmit,
  onCancel,
  submitting = false,
  initialData = null,
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(initialData));
  const [validationError, setValidationError] = useState(null);
  const isEditing = initialData !== null;

  useEffect(() => {
    setFormData(getInitialFormData(initialData));
    setValidationError(null);
  }, [initialData]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: name === "active" ? value === "true" : value,
    }));
    setValidationError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const price = Number(formData.price);
    const durationMinutes = Number(formData.duration_minutes);

    if (
      !formData.name.trim() ||
      formData.name.trim().length > 255 ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99 ||
      !/^\d+(\.\d{1,2})?$/.test(String(formData.price)) ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 2147483647
    ) {
      setValidationError(
        "Informe nome, preço com até duas casas decimais e duração em minutos válidos.",
      );
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: formatPriceForPayload(formData.price),
      duration_minutes: durationMinutes,
      active: formData.active,
    });
  }

  return (
    <form className="client-form-panel" onSubmit={handleSubmit}>
      <div className="client-form-header">
        <h3>{isEditing ? "Editar Serviço" : "Novo Serviço"}</h3>
        <p>Preencha os dados principais para salvar o serviço.</p>
      </div>

      {validationError && (
        <p className="clients-state-error" role="alert">
          {validationError}
        </p>
      )}

      <div className="client-form-grid">
        <label className="client-field">
          <span>Nome *</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={255}
            required
            disabled={submitting}
          />
        </label>

        <label className="client-field">
          <span>Preço *</span>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            max="99999999.99"
            step="0.01"
            required
            disabled={submitting}
          />
        </label>

        <label className="client-field">
          <span>Duração em minutos *</span>
          <input
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            min="1"
            max="2147483647"
            step="1"
            required
            disabled={submitting}
          />
        </label>

        <label className="client-field">
          <span>Status</span>
          <select
            name="active"
            value={String(formData.active)}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </label>

        <label className="client-field">
          <span>Descrição</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            disabled={submitting}
          />
        </label>
      </div>

      <div className="client-form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Salvar Serviço"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
