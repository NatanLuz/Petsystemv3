import api from '../services/api';

export async function getDashboardMetrics() {
  const response = await api.get('/dashboard/metrics');
  return response.data;
}
