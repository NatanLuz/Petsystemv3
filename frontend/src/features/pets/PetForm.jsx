import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listClients } from "../clients/clientService";
import { formatPhone } from "../clients/contactFormat";

function getInitialFormData(pet, defaultClientId = "") {
  return {
    client_id: pet?.client_id ?? defaultClientId,
    name: pet?.name ?? "",
    species: pet?.species ?? "",
    breed: pet?.breed ?? "",
    sex: pet?.sex ?? "",
    birth_date: pet?.birth_date?.slice(0, 10) ?? "",
    weight: pet?.weight ?? "",
    size: pet?.size ?? "",
    color: pet?.color ?? "",
    notes: pet?.notes ?? "",
    allergies: pet?.allergies ?? "",
    behavior_alerts: pet?.behavior_alerts ?? "",
  };
}

export default function PetForm({ onSubmit, onCancel, submitting = false, disabled = false, initialData = null, fieldErrors = {} }) {
  const [searchParams] = useSearchParams();
  const defaultClientId = searchParams.get("client_id") ?? "";
  const [formData, setFormData] = useState(() => getInitialFormData(initialData, defaultClientId));
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const isEditing = initialData !== null;
  const busy = submitting || disabled;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const errorFor = (field) => fieldErrors[field]?.[0];
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLocaleLowerCase("pt-BR");
    return clients.filter((client) => !query || [client.name, client.phone, client.email]
      .some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(query)));
  }, [clients, clientSearch]);

  useEffect(() => {
    setFormData(getInitialFormData(initialData, defaultClientId));
    setValidationError(null);
  }, [initialData, defaultClientId]);

  useEffect(() => {
    let active = true;
    async function loadClients() {
      try {
        const data = await listClients();
        if (active) {
          setClients(data);
          const selectedId = Number(initialData?.client_id ?? defaultClientId);
          setClientSearch(data.find((client) => Number(client.id) === selectedId)?.name ?? "");
        }
      } catch {
        if (active) setClientsError("Não foi possível carregar os tutores. Feche e abra o formulário para tentar novamente.");
      } finally {
        if (active) setLoadingClients(false);
      }
    }
    loadClients();
    return () => { active = false; };
  }, [initialData, defaultClientId]);

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
      size: formData.size.trim() || null,
      color: formData.color.trim() || null,
      notes: formData.notes.trim() || null,
      allergies: formData.allergies.trim() || null,
      behavior_alerts: formData.behavior_alerts.trim() || null,
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
          <input type="search" role="combobox" aria-autocomplete="list" aria-expanded={showClientSuggestions && filteredClients.length > 0}
            aria-controls="pet-client-options" aria-label="Buscar tutor por nome, telefone ou e-mail"
            placeholder="Digite o nome ou telefone do tutor" value={clientSearch}
            onFocus={() => setShowClientSuggestions(true)}
            onChange={(event) => { setClientSearch(event.target.value); setFormData((current) => ({ ...current, client_id: "" })); setShowClientSuggestions(true); }}
            required={!formData.client_id} aria-invalid={!!errorFor('client_id')} aria-describedby={errorFor('client_id') ? 'pet-client-id-error' : undefined} disabled={busy || loadingClients || !!clientsError || clients.length === 0} />
          {errorFor('client_id') && <span id="pet-client-id-error" className="client-field-error" role="alert">{errorFor('client_id')}</span>}
          {showClientSuggestions && clientSearch.trim() && filteredClients.length > 0 && (
            <ul id="pet-client-options" className="client-autocomplete-options" role="listbox">
              {filteredClients.slice(0, 8).map((client) => <li key={client.id} role="option" aria-selected={Number(formData.client_id) === Number(client.id)}>
                <button type="button" onClick={() => { setFormData((current) => ({ ...current, client_id: client.id })); setClientSearch(client.name); setShowClientSuggestions(false); }}>
                  {client.name}{client.phone ? ` · ${formatPhone(client.phone)}` : ""}
                </button>
              </li>)}
            </ul>
          )}
          {formData.client_id && <span className="client-field-hint">Tutor selecionado</span>}
        </label>
        <label className="client-field">
          <span>Nome *</span>
          <input name="name" value={formData.name} onChange={handleChange} maxLength={100} required aria-invalid={!!errorFor('name')} aria-describedby={errorFor('name') ? 'pet-name-error' : undefined} disabled={busy} />
          {errorFor('name') && <span id="pet-name-error" className="client-field-error" role="alert">{errorFor('name')}</span>}
        </label>
        <label className="client-field">
          <span>Espécie *</span>
          <input name="species" value={formData.species} onChange={handleChange} maxLength={50} required aria-invalid={!!errorFor('species')} aria-describedby={errorFor('species') ? 'pet-species-error' : undefined} disabled={busy} />
          {errorFor('species') && <span id="pet-species-error" className="client-field-error" role="alert">{errorFor('species')}</span>}
        </label>
        <label className="client-field">
          <span>Raça</span>
          <input name="breed" value={formData.breed} onChange={handleChange} maxLength={100} aria-invalid={!!errorFor('breed')} disabled={busy} />
          {errorFor('breed') && <span className="client-field-error" role="alert">{errorFor('breed')}</span>}
        </label>
        <label className="client-field">
          <span>Sexo</span>
          <input name="sex" value={formData.sex} onChange={handleChange} maxLength={20} aria-invalid={!!errorFor('sex')} disabled={busy} />
          {errorFor('sex') && <span className="client-field-error" role="alert">{errorFor('sex')}</span>}
        </label>
        <label className="client-field">
          <span>Data de nascimento</span>
          <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} max={today} aria-invalid={!!errorFor('birth_date')} disabled={busy} />
          {errorFor('birth_date') && <span className="client-field-error" role="alert">{errorFor('birth_date')}</span>}
        </label>
        <label className="client-field">
          <span>Peso (kg)</span>
          <input type="number" name="weight" value={formData.weight} onChange={handleChange} min="0.001" max="9999.999" step="0.001" aria-invalid={!!errorFor('weight')} disabled={busy} />
          {errorFor('weight') && <span className="client-field-error" role="alert">{errorFor('weight')}</span>}
        </label>
        <label className="client-field">
          <span>Porte</span>
          <input name="size" value={formData.size} onChange={handleChange} maxLength={30} aria-invalid={!!errorFor('size')} disabled={busy} />
          {errorFor('size') && <span className="client-field-error" role="alert">{errorFor('size')}</span>}
        </label>
        <label className="client-field">
          <span>Cor</span>
          <input name="color" value={formData.color} onChange={handleChange} maxLength={100} aria-invalid={!!errorFor('color')} disabled={busy} />
          {errorFor('color') && <span className="client-field-error" role="alert">{errorFor('color')}</span>}
        </label>
        <label className="client-field">
          <span>Observações</span>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} aria-invalid={!!errorFor('notes')} disabled={busy} />
          {errorFor('notes') && <span className="client-field-error" role="alert">{errorFor('notes')}</span>}
        </label>
        <label className="client-field">
          <span>Alergias</span>
          <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} maxLength={5000} aria-invalid={!!errorFor('allergies')} disabled={busy} />
          {errorFor('allergies') && <span className="client-field-error" role="alert">{errorFor('allergies')}</span>}
        </label>
        <label className="client-field">
          <span>Alertas de comportamento</span>
          <textarea name="behavior_alerts" value={formData.behavior_alerts} onChange={handleChange} rows={2} maxLength={5000} aria-invalid={!!errorFor('behavior_alerts')} disabled={busy} />
          {errorFor('behavior_alerts') && <span className="client-field-error" role="alert">{errorFor('behavior_alerts')}</span>}
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
