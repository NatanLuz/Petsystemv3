import api from "../../services/api";

export async function listServices() {
  const response = await api.get("/services");
  return response.data;
}

export async function createService(data) {
  const response = await api.post("/services", data);
  return response.data;
}

export async function updateService(id, data) {
  const response = await api.patch(`/services/${id}`, data);
  return response.data;
}

export async function deleteService(id) {
  const response = await api.delete(`/services/${id}`);
  return response.data;
}
