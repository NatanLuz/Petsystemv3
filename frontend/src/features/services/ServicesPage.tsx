import { useEffect, useMemo, useState } from 'react';
import { deleteService, listServices, type Service } from './serviceService';
import { ServiceForm } from './ServiceForm';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatPrice(price: string) {
  const numericPrice = Number(price);

  return Number.isNaN(numericPrice) ? price : currencyFormatter.format(numericPrice);
}

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadServices() {
    try {
      setIsLoading(true);
      setError(null);
      const serviceList = await listServices();
      setServices(serviceList);
    } catch {
      setError('Não foi possível carregar os serviços.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return services;
    }

    return services.filter((service) => {
      const name = service.name.toLowerCase();
      const description = service.description?.toLowerCase() ?? '';

      return name.includes(normalizedSearch) || description.includes(normalizedSearch);
    });
  }, [search, services]);

  async function handleDelete(id: number) {
    const shouldDelete = window.confirm('Deseja remover este serviço?');

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingServiceId(id);
      setFeedback(null);
      setDeleteError(null);
      await deleteService(id);
      setServices((currentServices) => currentServices.filter((service) => service.id !== id));
      setFeedback('Serviço excluído com sucesso.');
      if (editingService?.id === id) {
        handleCloseForm();
      }
    } catch {
      setDeleteError('Não foi possível remover o serviço.');
    } finally {
      setDeletingServiceId(null);
    }
  }

  function handleNewService() {
    setFeedback(null);
    setDeleteError(null);
    setEditingService(null);
    setIsFormVisible((current) => !current);
  }

  function handleEdit(service: Service) {
    setFeedback(null);
    setDeleteError(null);
    setEditingService(service);
    setIsFormVisible(true);
  }

  function handleCloseForm() {
    setEditingService(null);
    setIsFormVisible(false);
  }

  async function handleSaved(action: 'created' | 'updated') {
    await loadServices();
    setEditingService(null);
    setIsFormVisible(false);
    setFeedback(
      action === 'created'
        ? 'Serviço cadastrado com sucesso.'
        : 'Serviço atualizado com sucesso.',
    );
  }

  return (
    <main className="page clients-page">
      <section className="page-header clients-header">
        <div>
          <p>Cadastre e gerencie os serviços oferecidos pelo PetSystem.</p>
        </div>
        <button className="primary-button" type="button" onClick={handleNewService}>
          Novo Serviço
        </button>
      </section>

      {feedback && <p className="feedback success">{feedback}</p>}
      {deleteError && <p className="feedback error">{deleteError}</p>}

      {isFormVisible && (
        <section className="panel clients-form-panel">
          <div className="panel-header">
            <div>
              <h2>{editingService ? 'Editar serviço' : 'Novo serviço'}</h2>
              <p>
                {editingService
                  ? 'Atualize os dados principais do serviço.'
                  : 'Informe os dados principais para cadastrar um serviço.'}
              </p>
            </div>
          </div>
          <ServiceForm
            service={editingService}
            onCancel={handleCloseForm}
            onSaved={handleSaved}
          />
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Lista de serviços</h2>
            <p>Use a busca para encontrar registros rapidamente.</p>
          </div>
        </div>

        <div className="filters services-filters">
          <input
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isLoading && <p className="state">Carregando serviços...</p>}
        {error && <p className="state error">{error}</p>}
        {!isLoading && !error && filteredServices.length === 0 && (
          <p className="state">Nenhum serviço encontrado.</p>
        )}

        {!isLoading && !error && filteredServices.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>{formatPrice(service.price)}</td>
                    <td>{service.duration_minutes} min</td>
                    <td>
                      <span className={`badge ${service.active ? 'active' : 'inactive'}`}>
                        {service.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button
                        className="edit-button"
                        type="button"
                        onClick={() => handleEdit(service)}
                      >
                        Editar
                      </button>
                      <button
                        className="delete-button"
                        disabled={deletingServiceId === service.id}
                        type="button"
                        onClick={() => void handleDelete(service.id)}
                      >
                        {deletingServiceId === service.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
