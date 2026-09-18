import React, { useEffect, useState } from "react";

function getInitialFormData(initialData) {
  return {
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
  };
}

export default function ClientForm({
  onSubmit,
  submitting = false,
  initialData = null,
  onCancel,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData),
  );
  const isEditing = initialData !== null;

  useEffect(() => {
    setFormData(getInitialFormData(initialData));
  }, [initialData]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    onSubmit(formData);
  }

  return (
    <form className="client-form-panel" onSubmit={handleSubmit}>
      <div className="client-form-header">
        <h3>{isEditing ? "Editar Cliente" : "Novo Cliente"}</h3>
        <p>Preencha os dados principais para salvar o cliente.</p>
      </div>

      <div className="client-form-grid">
        <label className="client-field">
          <span>Nome *</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </label>

        <label className="client-field">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={submitting}
          />
        </label>

        <label className="client-field">
          <span>Telefone *</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </label>

        <label className="client-field">
          <span>Endereço</span>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={submitting}
          />
        </label>
      </div>

      <div className="client-form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Salvar Cliente"}
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
