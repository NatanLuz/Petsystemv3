import { api } from '../../lib/api';

export type Service = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  duration_minutes: number;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type ServicePayload = {
  name: string;
  description: string | null;
  price: string;
  duration_minutes: number;
  active: boolean;
};

type ApiService = Omit<Service, 'active'> & {
  active?: boolean;
  is_active?: boolean;
};

type PaginatedResponse<T> = {
  data: T[];
  links?: unknown;
  meta?: unknown;
};

function normalizeService(service: ApiService): Service {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    duration_minutes: service.duration_minutes,
    active: service.active ?? service.is_active ?? true,
    created_at: service.created_at,
    updated_at: service.updated_at,
  };
}

function normalizeResponse<T>(response: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(response) ? response : response.data;
}

function toApiPayload(payload: ServicePayload) {
  return {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    duration_minutes: payload.duration_minutes,
    is_active: payload.active,
  };
}

export async function listServices(): Promise<Service[]> {
  const response = await api.get<ApiService[] | PaginatedResponse<ApiService>>('/services');

  return normalizeResponse(response.data).map(normalizeService);
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const response = await api.post<{ data: ApiService }>('/services', toApiPayload(payload));

  return normalizeService(response.data.data);
}

export async function updateService(id: number, payload: ServicePayload): Promise<Service> {
  const response = await api.put<{ data: ApiService }>(`/services/${id}`, toApiPayload(payload));

  return normalizeService(response.data.data);
}

export async function deleteService(id: number): Promise<void> {
  await api.delete(`/services/${id}`);
}
