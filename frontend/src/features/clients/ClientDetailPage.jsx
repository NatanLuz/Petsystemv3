import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatAppointmentDate, appointmentStatuses } from '../appointments/AppointmentForm';
import { getClientById } from './clientService';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/feedback/Feedback';
import { formatPhone } from './contactFormat.js';

export default function ClientDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: false, client: null });
  const [loadRevision, setLoadRevision] = useState(0);

  useEffect(() => {
    let active = true;
    getClientById(id).then((client) => {
      if (active) setState({ loading: false, error: false, client });
    }).catch(() => {
      if (active) setState({ loading: false, error: true, client: null });
    });
    return () => { active = false; };
  }, [id, loadRevision]);

  const history = useMemo(() => (state.client?.pets ?? []).flatMap((pet) => [
    ...(pet.appointments ?? []).map((appointment) => ({ ...appointment, pet, kind: 'Agendamento', history_date: appointment.scheduled_at, history_services: [appointment.service?.name].filter(Boolean) })),
    ...(pet.attendances ?? []).map((attendance) => ({ ...attendance, pet, kind: 'Atendimento', history_date: attendance.completed_at || attendance.started_at, history_services: (attendance.services ?? []).map((service) => service.name) })),
  ])
    .sort((a, b) => String(b.history_date).localeCompare(String(a.history_date)))
    .slice(0, 10), [state.client]);

  if (state.loading) return <section className="clients-page"><LoadingSkeleton label="Carregando ficha do cliente..." /></section>;
  if (state.error || !state.client) return <section className="clients-page"><ErrorState message="Não foi possível carregar a ficha do cliente." onRetry={() => { setState((current) => ({ ...current, loading: true, error: false })); setLoadRevision((value) => value + 1); }} /><Link to="/clients">Voltar para clientes</Link></section>;

  const client = state.client;
  return (
    <section className="clients-page">
      <header className="clients-header">
        <div><h1>{client.name}</h1><p>{client.phone ? formatPhone(client.phone) : 'Telefone não informado'}{client.email ? ` · ${client.email}` : ''}</p></div>
        <div className="clients-table-actions">
          <Link className="btn btn-primary" to={`/pets?client_id=${client.id}`}>Novo pet</Link>
          <Link className="btn btn-secondary" to={`/appointments?client_id=${client.id}`}>Novo agendamento</Link>
        </div>
      </header>
      {client.address && <p className="clients-panel client-detail-address">{client.address}</p>}
      <section className="clients-panel">
        <h2 className="client-detail-heading">Pets deste tutor</h2>
        {(client.pets ?? []).length === 0 ? <EmptyState message="Nenhum pet cadastrado." /> : (
          <ul className="client-detail-pets">{client.pets.map((pet) => <li key={pet.id}>
            <strong>{pet.name}</strong><span>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</span>
            {(pet.allergies || pet.behavior_alerts) && <span className="client-detail-alert">{[pet.allergies && `Alergias: ${pet.allergies}`, pet.behavior_alerts && `Comportamento: ${pet.behavior_alerts}`].filter(Boolean).join(' · ')}</span>}
          </li>)}</ul>
        )}
      </section>
      <section className="clients-panel">
        <h2 className="client-detail-heading">Últimos agendamentos e atendimentos</h2>
        {history.length === 0 ? <EmptyState message="Ainda não há histórico para este cliente." /> : (
          <div className="clients-table-wrapper" role="region" aria-label="Histórico do cliente" tabIndex={0}>
            <table className="clients-table"><thead><tr><th>Tipo</th><th>Data</th><th>Pet</th><th>Serviços</th><th>Status</th></tr></thead>
              <tbody>{history.map((item) => <tr key={`${item.kind}-${item.id}`}><td>{item.kind}</td><td>{formatAppointmentDate(item.history_date)}</td><td>{item.pet.name}</td><td>{item.history_services.join(', ') || 'Serviço indisponível'}</td><td>{appointmentStatuses[item.status]?.label ?? (item.status === 'completed' ? 'Concluído' : item.status === 'in_progress' ? 'Em atendimento' : item.status)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
      <Link to="/clients">Voltar para clientes</Link>
    </section>
  );
}
