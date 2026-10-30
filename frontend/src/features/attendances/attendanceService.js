import api from '../../services/api';

export async function listAttendances() {
  const response = await api.get('/attendances');
  return response.data;
}

export async function createAttendance(data) {
  const response = await api.post('/attendances', data);
  return response.data;
}

export async function updateAttendance(id, data) {
  const response = await api.patch(`/attendances/${id}`, data);
  return response.data;
}
