import api from "../../services/api";

export async function listAppointments() {
  const response = await api.get("/appointments");
  return response.data;
}

export async function createAppointment(data) {
  const response = await api.post("/appointments", data);
  return response.data;
}

export async function updateAppointment(id, data) {
  const response = await api.patch(`/appointments/${id}`, data);
  return response.data;
}

export async function deleteAppointment(id) {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
}
