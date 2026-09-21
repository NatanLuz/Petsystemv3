import React, { useEffect, useMemo, useRef, useState } from "react";
import PetForm from "./PetForm";
import { createPet, deletePet, listPets, updatePet } from "./petService";

const fieldLabels = {
  client_id: "Tutor", name: "Nome", species: "Espécie", breed: "Raça",
  sex: "Sexo", birth_date: "Data de nascimento", weight: "Peso", notes: "Observações",
};

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [deletingPetId, setDeletingPetId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const operationPending = useRef(false);
  const busy = submitting || deletingPetId !== null;

  const filteredPets = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return pets.filter((pet) =>
      [pet.name, pet.public_code, pet.species, pet.breed, pet.client?.name]
        .some((value) => String(value ?? "").toLowerCase().includes(search)),
    );
  }, [pets, searchTerm]);

  useEffect(() => {
    let active = true;
    async function loadPets() {
      try {
        const data = await listPets();
        if (active) setPets(data);
      } catch {
        if (active) setError("Não foi possível carregar os pets. Tente novamente mais tarde.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPets();
    return () => { active = false; };
  }, []);

  function clearOperationMessages() {
    setSuccessMessage(null);
    setSubmitError(null);
    setDeleteError(null);
  }

  function openForm(pet = null) {
    if (operationPending.current) return;
    clearOperationMessages();
    setEditingPet(pet);
    setFormKey((key) => key + 1);
    setIsFormOpen(true);
  }

  function handleCancelForm() {
    if (operationPending.current) return;
    setEditingPet(null);
    setIsFormOpen(false);
    setSubmitError(null);
  }

  async function handleSubmitPet(data) {
    if (operationPending.current) return;
    operationPending.current = true;
    setSubmitting(true);
    clearOperationMessages();
    try {
      const savedPet = editingPet
        ? await updatePet(editingPet.id, data)
        : await createPet(data);
      setPets((current) => editingPet
        ? current.map((pet) => pet.id === editingPet.id ? savedPet : pet)
        : [...current, savedPet]);
      setSuccessMessage(editingPet ? "Pet atualizado com sucesso." : "Pet cadastrado com sucesso.");
      setEditingPet(null);
      setIsFormOpen(false);
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        // Use only known field names; never render arbitrary server diagnostics.
        const errors = requestError.response.data?.errors;
        const fields = Object.keys(fieldLabels).filter((field) => errors?.[field]).map((field) => fieldLabels[field]);
        setSubmitError(fields.length
          ? `Verifique os campos: ${fields.join(", ")}. Corrija os dados e tente novamente.`
          : "Verifique os dados informados e tente novamente.");
      } else {
        setSubmitError(editingPet
          ? "Não foi possível atualizar o pet. Tente novamente mais tarde."
          : "Não foi possível cadastrar o pet. Tente novamente mais tarde.");
      }
    } finally {
      operationPending.current = false;
      setSubmitting(false);
    }
  }

  async function handleDeletePet(pet) {
    if (operationPending.current) return;
    if (!window.confirm(`Deseja realmente excluir o pet ${pet.name}?`)) return;
    operationPending.current = true;
    setDeletingPetId(pet.id);
    clearOperationMessages();
    try {
      await deletePet(pet.id);
      setPets((current) => current.filter((item) => item.id !== pet.id));
      if (editingPet?.id === pet.id) {
        setEditingPet(null);
        setIsFormOpen(false);
      }
      setSuccessMessage("Pet excluído com sucesso.");
    } catch {
      setDeleteError("Não foi possível excluir o pet. Tente novamente mais tarde.");
    } finally {
      operationPending.current = false;
      setDeletingPetId(null);
    }
  }

  return (
    <section className="clients-page">
      <header className="clients-header">
        <div>
          <p>Cadastre e gerencie os pets e seus tutores no PetSystem.</p>
        </div>
        <button type="button" className="btn btn-primary clients-new-button" onClick={() => openForm()} disabled={busy || loading || !!error}>+ Novo Pet</button>
      </header>
      {successMessage && <div className="clients-feedback clients-feedback-success" role="status">{successMessage}</div>}
      {isFormOpen && (
        <PetForm key={formKey} initialData={editingPet} onSubmit={handleSubmitPet}
          onCancel={handleCancelForm} submitting={submitting} disabled={deletingPetId !== null} />
      )}
      {submitError && <div className="clients-feedback clients-feedback-error" role="alert">{submitError}</div>}
      {deleteError && <div className="clients-feedback clients-feedback-error" role="alert">{deleteError}</div>}
      <section className="clients-panel">
        <div className="clients-toolbar">
          <label className="clients-search-label" htmlFor="pet-search">Buscar pets</label>
          <input id="pet-search" className="clients-search-input" type="search"
            placeholder="Buscar por nome, código, espécie, raça ou tutor..."
            value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
        {loading && <div className="clients-state" role="status">Carregando pets...</div>}
        {!loading && error && <div className="clients-state clients-state-error" role="alert">{error}</div>}
        {!loading && !error && pets.length === 0 && <div className="clients-state">Nenhum pet cadastrado.</div>}
        {!loading && !error && pets.length > 0 && filteredPets.length === 0 && (
          <div className="clients-state">Nenhum pet encontrado para esta busca.</div>
        )}
        {!loading && !error && filteredPets.length > 0 && (
          <div className="clients-table-wrapper">
            <table className="clients-table">
              <thead><tr><th>Código</th><th>Nome</th><th>Espécie</th><th>Raça</th><th>Tutor</th><th>Ações</th></tr></thead>
              <tbody>
                {filteredPets.map((pet) => (
                  <tr key={pet.id}>
                    <td>{pet.public_code || "Não informado"}</td>
                    <td>{pet.name}</td>
                    <td>{pet.species}</td>
                    <td>{pet.breed || "Não informada"}</td>
                    <td>{pet.client?.name || "Tutor indisponível"}</td>
                    <td>
                      <div className="clients-table-actions">
                        <button type="button" className="clients-action-button clients-action-edit" onClick={() => openForm(pet)} disabled={busy}>Editar</button>
                        <button type="button" className="clients-action-button clients-action-delete" onClick={() => handleDeletePet(pet)} disabled={busy}>
                          {deletingPetId === pet.id ? "Excluindo..." : "Excluir"}
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
