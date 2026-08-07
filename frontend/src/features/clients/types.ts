export type ClientStatus = 'active' | 'inactive';

export type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  document: string | null;
  address: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ClientPayload = {
  name: string;
  email?: string;
  phone: string;
  document?: string;
  address?: string;
  status: ClientStatus;
  notes?: string;
};

export type ClientFilters = {
  search?: string;
  status?: ClientStatus | '';
};

export type PaginatedResponse<T> = {
  data: T[];
  links: unknown;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
