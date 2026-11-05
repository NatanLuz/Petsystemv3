import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { createService, updateService, type Service, type ServicePayload } from './serviceService';

type ServiceFormProps = {
  service?: Service | null;
  onCancel: () => void;
  onSaved: (action: 'created' | 'updated') => Promise<void> | void;
};

type FormPayload = {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  active: boolean;
};

type ValidationResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const initialPayload: FormPayload = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '',
  active: true,
};

function toDecimalPrice(value: string) {
  const normalizedValue = value.replace(',', '.');
  const numericValue = Number(normalizedValue);

  if (Number.isNaN(numericValue)) {
    return normalizedValue;
  }

  return numericValue.toFixed(2);
}

function getErrorMessage(error: unknown, isEditing: boolean) {
  if (error instanceof AxiosError && error.response?.status === 422) {
    const data = error.response.data as ValidationResponse;
    const firstFieldError = data.errors ? Object.values(data.errors)[0]?.[0] : null;

    return firstFieldError ?? data.message ?? 'Confira os campos informados.';
  }

  return isEditing
    ? 'Nao foi possivel salvar as alteracoes do servico.'
    : 'Nao foi possivel cadastrar o servico.';
}

export function ServiceForm({ service, onCancel, onSaved }: ServiceFormProps) {
  const [payload, setPayload] = useState<FormPayload>(initialPayload);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(service);

  useEffect(() => {
    if (service) {
      setPayload({
        name: service.name,
        description: service.description ?? '',
        price: service.price,
        duration_minutes: String(service.duration_minutes),
        active: service.active,
      });
      setError(null);
      return;
    }

    setPayload(initialPayload);
    setError(null);
  }, [service]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const servicePayload: ServicePayload = {
      name: payload.name,
      description: payload.description.trim() ? payload.description : null,
      price: toDecimalPrice(payload.price),
      duration_minutes: Number(payload.duration_minutes),
      active: payload.active,
    };

    try {
      setIsSaving(true);
      setError(null);

      if (service) {
        await updateService(service.id, servicePayload);
        await onSaved('updated');
      } else {
        await createService(servicePayload);
        setPayload(initialPayload);
        await onSaved('created');
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, isEditing));
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
            maxLength={255}
            required
            value={payload.name}
            onChange={(event) => setPayload({ ...payload, name: event.target.value })}
          />
        </label>

        <label>
          Preço *
          <input
            min="0"
            required
            step="0.01"
            type="number"
            value={payload.price}
            onChange={(event) => setPayload({ ...payload, price: event.target.value })}
          />
        </label>

        <label>
          Duração em minutos *
          <input
            min="1"
            required
            step="1"
            type="number"
            value={payload.duration_minutes}
            onChange={(event) => setPayload({ ...payload, duration_minutes: event.target.value })}
          />
        </label>

        <label>
          Status
          <select
            value={payload.active ? 'active' : 'inactive'}
            onChange={(event) =>
              setPayload({ ...payload, active: event.target.value === 'active' })
            }
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>
      </div>

      <label>
        Descrição
        <textarea
          value={payload.description}
          onChange={(event) => setPayload({ ...payload, description: event.target.value })}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Serviço'}
        </button>
        <button className="secondary-button" disabled={isSaving} type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
