import api from "../../services/api";

export async function listClients() {
  const response = await api.get("/clients");

  return response.data;
}

export async function getClientById(id) {
  const response = await api.get(`/clients/${id}`);

  return response.data;
}

export async function createClient(data) {
  const response = await api.post("/clients", data);

  return response.data;
}

export async function updateClient(id, data) {
  const response = await api.patch(`/clients/${id}`, data);

  return response.data;
}

export async function deleteClient(id) {
  const response = await api.delete(`/clients/${id}`);

  return response.data;
}
