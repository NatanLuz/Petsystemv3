import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listClients } from "../clients/clientService";

function getInitialFormData(pet) {
  return {
    client_id: pet?.client_id ?? "",
    name: pet?.name ?? "",
    species: pet?.species ?? "",
    breed: pet?.breed ?? "",
    sex: pet?.sex ?? "",
    birth_date: pet?.birth_date?.slice(0, 10) ?? "",
    weight: pet?.weight ?? "",
    notes: pet?.notes ?? "",
  };
}

export default function PetForm({ onSubmit, onCancel, submitting = false, disabled = false, initialData = null }) {
  const [formData, setFormData] = useState(() => getInitialFormData(initialData));
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const isEditing = initialData !== null;
  const busy = submitting || disabled;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    setFormData(getInitialFormData(initialData));
    setValidationError(null);
  }, [initialData]);

  useEffect(() => {
    let active = true;
    async function loadClients() {
      try {
        const data = await listClients();
        if (active) setClients(data);
      } catch {
        if (active) setClientsError("Não foi possível carregar os tutores. Feche e abra o formulário para tentar novamente.");
      } finally {
        if (active) setLoadingClients(false);
      }
    }
    loadClients();
    return () => { active = false; };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setValidationError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (busy || loadingClients || clientsError || clients.length === 0) return;
    const clientId = Number(formData.client_id);
    const weight = formData.weight === "" ? null : Number(formData.weight);
    if (!Number.isInteger(clientId) || !clients.some((client) => Number(client.id) === clientId)
      || !formData.name.trim() || !formData.species.trim()
      || (formData.birth_date && formData.birth_date > today)
      || (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 9999.999))) {
      setValidationError("Informe tutor, nome e espécie válidos, nascimento até hoje e peso maior que zero e até 9999,999 kg.");
      return;
    }
    onSubmit({
      client_id: clientId,
      name: formData.name.trim(),
      species: formData.species.trim(),
      breed: formData.breed.trim() || null,
      sex: formData.sex.trim() || null,
      birth_date: formData.birth_date || null,
      weight,
      notes: formData.notes.trim() || null,
    });
  }

  return (
    <form className="client-form-panel" onSubmit={handleSubmit}>
      <div className="client-form-header">
        <h3>{isEditing ? "Editar Pet" : "Novo Pet"}</h3>
        <p>Preencha os dados do pet e selecione seu tutor.</p>
      </div>
      {loadingClients && <p role="status">Carregando tutores...</p>}
      {clientsError && <p className="clients-state-error" role="alert">{clientsError}</p>}
      {!loadingClients && !clientsError && clients.length === 0 && (
        <p role="status">É necessário <Link to="/clients">cadastrar um cliente</Link> antes de cadastrar um Pet.</p>
      )}
      {validationError && <p className="clients-state-error" role="alert">{validationError}</p>}
      <div className="client-form-grid">
        <label className="client-field">
          <span>Tutor *</span>
          <select name="client_id" value={formData.client_id} onChange={handleChange} required disabled={busy || loadingClients || !!clientsError || clients.length === 0}>
            <option value="">Selecione um tutor</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="client-field">
          <span>Nome *</span>
          <input name="name" value={formData.name} onChange={handleChange} maxLength={100} required disabled={busy} />
        </label>
        <label className="client-field">
          <span>Espécie *</span>
          <input name="species" value={formData.species} onChange={handleChange} maxLength={50} required disabled={busy} />
        </label>
        <label className="client-field">
          <span>Raça</span>
          <input name="breed" value={formData.breed} onChange={handleChange} maxLength={100} disabled={busy} />
        </label>
        <label className="client-field">
          <span>Sexo</span>
          <input name="sex" value={formData.sex} onChange={handleChange} maxLength={20} disabled={busy} />
        </label>
        <label className="client-field">
          <span>Data de nascimento</span>
          <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} max={today} disabled={busy} />
        </label>
        <label className="client-field">
          <span>Peso (kg)</span>
          <input type="number" name="weight" value={formData.weight} onChange={handleChange} min="0.001" max="9999.999" step="0.001" disabled={busy} />
        </label>
        <label className="client-field">
          <span>Observações</span>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} disabled={busy} />
        </label>
      </div>
      <div className="client-form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy || loadingClients || !!clientsError || clients.length === 0}>
          {submitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Salvar Pet"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
      </div>
    </form>
  );
}
