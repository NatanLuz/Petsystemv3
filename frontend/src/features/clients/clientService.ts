import { api } from '../../lib/api';
import type { Client, ClientFilters, ClientPayload, PaginatedResponse } from './types';

export async function listClients(filters: ClientFilters = {}): Promise<PaginatedResponse<Client>> {
  const response = await api.get<PaginatedResponse<Client>>('/clients', {
    params: filters,
  });

  return response.data;
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const response = await api.post<{ data: Client }>('/clients', payload);

  return response.data.data;
}

export async function updateClient(id: number, payload: ClientPayload): Promise<Client> {
  const response = await api.put<{ data: Client }>(`/clients/${id}`, payload);

  return response.data.data;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}
