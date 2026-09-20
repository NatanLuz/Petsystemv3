import api from "../../services/api";

export async function listPets() {
  const response = await api.get("/pets");
  return response.data;
}

export async function createPet(data) {
  const response = await api.post("/pets", data);
  return response.data;
}

export async function updatePet(id, data) {
  const response = await api.patch(`/pets/${id}`, data);
  return response.data;
}

export async function deletePet(id) {
  const response = await api.delete(`/pets/${id}`);
  return response.data;
}
