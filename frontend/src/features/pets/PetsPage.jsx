import { useAuth } from "../auth/AuthContext";
import { can } from "../auth/permissions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../useDebouncedValue";
import { getPageSlice, DEFAULT_PAGE_SIZE } from "../listPagination";
import PetForm from "./PetForm";
import { filterPets } from "./petSearch";
import { createPet, deletePet, listPets, updatePet } from "./petService";

const fieldLabels = {
  client_id: "Tutor", name: "Nome", species: "Espécie", breed: "Raça",
  sex: "Sexo", birth_date: "Data de nascimento", weight: "Peso", notes: "Observações",
  size: "Porte", color: "Cor", allergies: "Alergias", behavior_alerts: "Alertas de comportamento",
};

export default function PetsPage() {
  const { user } = useAuth();
  const canCreate = can(user, "pets.create");
  const canUpdate = can(user, "pets.update");
  const canDelete = can(user, "pets.delete");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingPet, setEditingPet] = useState(null);
  const [deletingPetId, setDeletingPetId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [successMessage, setSuccessMessage] = useState(null);
  const operationPending = useRef(false);
  const busy = submitting || deletingPetId !== null;

  const filteredPets = useMemo(
    () => filterPets(pets, debouncedSearch),
    [pets, debouncedSearch],
  );
  const petPage = getPageSlice(filteredPets, page);

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
    setFieldErrors({});
    setDeleteError(null);
  }

  function openForm(pet = null) {
    if (!(pet ? canUpdate : canCreate)) return;
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
    if (!(editingPet ? canUpdate : canCreate)) return;
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
      if (requestError.response?.status === 403) {
        setSubmitError(null);
      } else if (requestError.response?.status === 422) {
        // Use only known field names; never render arbitrary server diagnostics.
        const errors = requestError.response.data?.errors;
        setFieldErrors(errors || {});
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
    if (!canDelete) return;
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
    } catch (requestError) {
      if (requestError.response?.status === 403) return;
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
        {canCreate && (<button type="button" className="btn btn-primary clients-new-button" onClick={() => openForm()} disabled={busy || loading || !!error}>+ Novo Pet</button>)}
      </header>
      {successMessage && <div className="clients-feedback clients-feedback-success" role="status">{successMessage}</div>}
      {isFormOpen && (editingPet ? canUpdate : canCreate) && (
          <PetForm key={formKey} initialData={editingPet} onSubmit={handleSubmitPet} fieldErrors={fieldErrors}
          onCancel={handleCancelForm} submitting={submitting} disabled={deletingPetId !== null} />
      )}
      {submitError && <div className="clients-feedback clients-feedback-error" role="alert">{submitError}</div>}
      {deleteError && <div className="clients-feedback clients-feedback-error" role="alert">{deleteError}</div>}
      <section className="clients-panel">
        <div className="clients-toolbar">
          <label className="clients-search-label" htmlFor="pet-search">Buscar pets</label>
          <input id="pet-search" className="clients-search-input" type="search"
            placeholder="Buscar por nome, código, espécie, raça ou tutor..."
            value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} />
        </div>
        {loading && <div className="clients-state" role="status">Carregando pets...</div>}
        {!loading && error && <div className="clients-state clients-state-error" role="alert">{error}</div>}
        {!loading && !error && pets.length === 0 && <div className="clients-state">Nenhum pet cadastrado.</div>}
        {!loading && !error && pets.length > 0 && filteredPets.length === 0 && (
          <div className="clients-state">Nenhum pet encontrado para esta busca.</div>
        )}
        {!loading && !error && filteredPets.length > 0 && (
          <div className="clients-table-wrapper" role="region" aria-label="Tabela de pets" tabIndex={0}>
            <table className="clients-table">
              <thead><tr><th>Código</th><th>Nome</th><th>Espécie</th><th>Raça</th><th>Tutor</th><th>Ações</th></tr></thead>
              <tbody>
                {petPage.items.map((pet) => (
                  <tr key={pet.id}>
                    <td>{pet.public_code || "Não informado"}</td>
                    <td><Link to={`/pets/${pet.id}`}>{pet.name}</Link></td>
                    <td>{pet.species}</td>
                    <td>{pet.breed || "Não informada"}</td>
                    <td>{pet.client?.name || "Tutor indisponível"}</td>
                    <td>
                      <div className="clients-table-actions">
                        {canUpdate && (<button type="button" className="clients-action-button clients-action-edit" onClick={() => openForm(pet)} disabled={busy}>Editar</button>)}
                        {canDelete && (<button type="button" className="clients-action-button clients-action-delete" onClick={() => handleDeletePet(pet)} disabled={busy}>
                          {deletingPetId === pet.id ? "Excluindo..." : "Excluir"}
                        </button>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filteredPets.length > DEFAULT_PAGE_SIZE && <nav className="clients-pagination" aria-label="Paginação de pets"><span>Mostrando {petPage.firstItem}–{petPage.lastItem} de {petPage.total}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={petPage.page === 1}>Anterior</button><span>Página {petPage.page} de {petPage.pageCount}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.min(petPage.pageCount, current + 1))} disabled={petPage.page === petPage.pageCount}>Próxima</button></nav>}
      </section>
    </section>
  );
}
