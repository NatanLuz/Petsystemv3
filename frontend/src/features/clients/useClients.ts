import { useCallback, useEffect, useState } from 'react';
import { listClients } from './clientService';
import type { Client, ClientFilters } from './types';

export function useClients(filters: ClientFilters) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listClients(filters);
      setClients(response.data);
    } catch {
      setError('Nao foi possivel carregar os clientes.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  return {
    clients,
    isLoading,
    error,
    reload: loadClients,
  };
}
