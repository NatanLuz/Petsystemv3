import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appointmentStatuses, formatAppointmentDate } from '../appointments/AppointmentForm';
import { getPetById } from './petService';

export default function PetDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: false, pet: null });

  useEffect(() => {
    let active = true;
    getPetById(id).then((pet) => {
      if (active) setState({ loading: false, error: false, pet });
    }).catch(() => {
      if (active) setState({ loading: false, error: true, pet: null });
    });
    return () => { active = false; };
  }, [id]);

  const history = useMemo(() => [
    ...(state.pet?.appointments ?? []).map((item) => ({ ...item, kind: 'Agendamento', history_date: item.scheduled_at, history_services: [item.service?.name].filter(Boolean) })),
    ...(state.pet?.attendances ?? []).map((item) => ({ ...item, kind: 'Atendimento', history_date: item.completed_at || item.started_at, history_services: (item.services ?? []).map((service) => service.name) })),
  ].sort((a, b) => String(b.history_date).localeCompare(String(a.history_date)))
    .slice(0, 10), [state.pet]);

  if (state.loading) return <section className="clients-page"><p className="clients-state" role="status">Carregando ficha do pet...</p></section>;
  if (state.error || !state.pet) return <section className="clients-page"><p className="clients-state clients-state-error" role="alert">Não foi possível carregar a ficha do pet.</p><Link to="/pets">Voltar para pets</Link></section>;

  const pet = state.pet;
  return (
    <section className="clients-page">
      <header className="clients-header">
        <div><h1>{pet.name}</h1><p>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''} · Código {pet.public_code}</p>
          <p>Tutor: <Link to={`/clients/${pet.client?.id}`}>{pet.client?.name ?? 'Tutor indisponível'}</Link></p></div>
        <Link className="btn btn-primary" to={`/appointments?client_id=${pet.client_id}&pet_id=${pet.id}`}>Novo agendamento</Link>
      </header>
      <section className="clients-panel client-pet-facts">
        <h2 className="client-detail-heading">Ficha do pet</h2>
        <dl><div><dt>Sexo</dt><dd>{pet.sex || 'Não informado'}</dd></div><div><dt>Nascimento</dt><dd>{pet.birth_date || 'Não informado'}</dd></div>
          <div><dt>Peso</dt><dd>{pet.weight ? `${pet.weight} kg` : 'Não informado'}</dd></div><div><dt>Porte</dt><dd>{pet.size || 'Não informado'}</dd></div>
          <div><dt>Cor</dt><dd>{pet.color || 'Não informada'}</dd></div></dl>
        {pet.notes && <p><strong>Observações:</strong> {pet.notes}</p>}
        {pet.allergies && <p className="client-detail-alert"><strong>Alergias:</strong> {pet.allergies}</p>}
        {pet.behavior_alerts && <p className="client-detail-alert"><strong>Alertas de comportamento:</strong> {pet.behavior_alerts}</p>}
      </section>
      <section className="clients-panel">
        <h2 className="client-detail-heading">Histórico de agendamentos e atendimentos</h2>
        {history.length === 0 ? <p className="clients-state">Ainda não há histórico para este pet.</p> : (
          <div className="clients-table-wrapper" role="region" aria-label="Histórico do pet" tabIndex={0}>
            <table className="clients-table"><thead><tr><th>Tipo</th><th>Data</th><th>Serviços</th><th>Status</th></tr></thead>
              <tbody>{history.map((item) => <tr key={`${item.kind}-${item.id}`}><td>{item.kind}</td><td>{formatAppointmentDate(item.history_date)}</td><td>{item.history_services.join(', ') || 'Serviço indisponível'}</td><td>{appointmentStatuses[item.status]?.label ?? (item.status === 'completed' ? 'Concluído' : item.status === 'in_progress' ? 'Em atendimento' : item.status)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
      <Link to="/pets">Voltar para pets</Link>
    </section>
  );
}
