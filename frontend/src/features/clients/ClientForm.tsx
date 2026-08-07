import { FormEvent, useState } from 'react';
import { createClient } from './clientService';
import type { ClientPayload, ClientStatus } from './types';

const initialPayload: ClientPayload = {
  name: '',
  email: '',
  phone: '',
  document: '',
  address: '',
  status: 'active',
  notes: '',
};

type ClientFormProps = {
  onCreated: () => void;
};

export function ClientForm({ onCreated }: ClientFormProps) {
  const [payload, setPayload] = useState<ClientPayload>(initialPayload);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      await createClient(payload);
      setPayload(initialPayload);
      onCreated();
    } catch {
      setError('Nao foi possivel cadastrar o cliente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Nome
          <input
            required
            value={payload.name}
            onChange={(event) => setPayload({ ...payload, name: event.target.value })}
          />
        </label>

        <label>
          Telefone
          <input
            required
            value={payload.phone}
            onChange={(event) => setPayload({ ...payload, phone: event.target.value })}
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
          Documento
          <input
            value={payload.document}
            onChange={(event) => setPayload({ ...payload, document: event.target.value })}
          />
        </label>

        <label>
          Status
          <select
            value={payload.status}
            onChange={(event) =>
              setPayload({ ...payload, status: event.target.value as ClientStatus })
            }
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>

        <label>
          Endereco
          <input
            value={payload.address}
            onChange={(event) => setPayload({ ...payload, address: event.target.value })}
          />
        </label>
      </div>

      <label>
        Observacoes
        <textarea
          value={payload.notes}
          onChange={(event) => setPayload({ ...payload, notes: event.target.value })}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" disabled={isSaving} type="submit">
        {isSaving ? 'Salvando...' : 'Cadastrar cliente'}
      </button>
    </form>
  );
}
