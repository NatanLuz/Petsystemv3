import { FormEvent, useEffect, useState } from 'react';
import { createClient, updateClient } from './clientService';
import type { Client, ClientPayload } from './types';

type VisibleClientPayload = Pick<ClientPayload, 'name' | 'email' | 'phone' | 'address'>;

const initialPayload: VisibleClientPayload = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

type ClientFormProps = {
  client?: Client | null;
  onCancel: () => void;
  onSaved: (action: 'created' | 'updated') => Promise<void> | void;
};

export function ClientForm({ client, onCancel, onSaved }: ClientFormProps) {
  const [payload, setPayload] = useState<VisibleClientPayload>(initialPayload);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(client);

  useEffect(() => {
    if (client) {
      setPayload({
        name: client.name,
        email: client.email ?? '',
        phone: client.phone,
        address: client.address ?? '',
      });
      setError(null);
      return;
    }

    setPayload(initialPayload);
    setError(null);
  }, [client]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      if (client) {
        await updateClient(client.id, payload as ClientPayload);
        await onSaved('updated');
      } else {
        await createClient(payload as ClientPayload);
        setPayload(initialPayload);
        await onSaved('created');
      }
    } catch {
      setError(
        isEditing
          ? 'Nao foi possivel salvar as alteracoes do cliente.'
          : 'Nao foi possivel cadastrar o cliente.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Nome *
          <input
            required
            value={payload.name}
            onChange={(event) => setPayload({ ...payload, name: event.target.value })}
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={payload.email}
            onChange={(event) => setPayload({ ...payload, email: event.target.value })}
          />
        </label>

        <label>
          Telefone *
          <input
            required
            value={payload.phone}
            onChange={(event) => setPayload({ ...payload, phone: event.target.value })}
          />
        </label>

        <label>
          Endereco
          <input
            value={payload.address}
            onChange={(event) => setPayload({ ...payload, address: event.target.value })}
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alteracoes' : 'Salvar Cliente'}
        </button>
        <button className="secondary-button" disabled={isSaving} type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
