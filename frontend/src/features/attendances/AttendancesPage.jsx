import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../useDebouncedValue';
import { getPageSlice, DEFAULT_PAGE_SIZE } from '../listPagination';
import { useAuth } from '../auth/AuthContext';
import { can } from '../auth/permissions';
import { listAppointments } from '../appointments/appointmentService';
import { listClients } from '../clients/clientService';
import { listPets } from '../pets/petService';
import { listServices } from '../services/serviceService';
import { EmptyState, ErrorState, LoadingSkeleton, Toast } from '../../components/feedback/Feedback';
import { createAttendance, listAttendances, updateAttendance } from './attendanceService';

const paymentMethods = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Transferência'];
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function formatDate(value) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Não informado' : dateFormat.format(date);
}

export default function AttendancesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReception = user?.role === 'receptionist';
  const isVet = user?.role === 'veterinarian';
  const [searchParams, setSearchParams] = useSearchParams();
  const [attendances, setAttendances] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ appointment_id: '', client_id: '', pet_id: '', service_ids: [], amount_charged: '', payment_method: '', notes: '', evolution: '', status: 'in_progress' });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query);
  const canCreate = can(user, 'attendances.create');
  const canUpdate = can(user, 'attendances.update');
  const canViewFinance = can(user, 'dashboard.finance.view');

  async function refresh() {
    setLoading(true);
    setOptionsLoading(true);
    setError('');
    setOptionsError('');

    const attendanceRequest = listAttendances()
      .then((nextAttendances) => {
        if (!Array.isArray(nextAttendances)) throw new TypeError('Invalid attendance list response.');
        setAttendances(nextAttendances);
      })
      .catch(() => setError('Não foi possível carregar os atendimentos. Tente novamente.'))
      .finally(() => setLoading(false));

    const optionRequests = [
      [listAppointments, setAppointments],
      [listClients, setClients],
      [listPets, setPets],
      [listServices, setServices],
    ];
    const optionsRequest = Promise.allSettled(optionRequests.map(([load, setData]) => load().then((data) => {
      if (!Array.isArray(data)) throw new TypeError('Invalid attendance form options response.');
      setData(data);
    }))).then((results) => {
      if (results.some((result) => result.status === 'rejected')) {
        setOptionsError('Não foi possível carregar todas as opções do formulário. Tente novamente.');
      }
    }).finally(() => setOptionsLoading(false));

    await Promise.all([attendanceRequest, optionsRequest]);
  }

  useEffect(() => { refresh(); }, []);

  const availablePets = useMemo(() => pets.filter((pet) => !form.client_id || Number(pet.client_id) === Number(form.client_id)), [pets, form.client_id]);
  const availableAppointments = appointments.filter((item) => item.status === 'confirmed');
  const statusFilter = searchParams.get('status') || '';
  const visibleAttendances = attendances.filter((item) => (!statusFilter || item.status === statusFilter)
    && [item.client?.name, item.pet?.name, item.status, item.services?.map((service) => service.name).join(' ')].join(' ').toLocaleLowerCase('pt-BR').includes(debouncedQuery.trim().toLocaleLowerCase('pt-BR')));
  const attendancePage = getPageSlice(visibleAttendances, page);

  function startNew() {
    setEditing(null);
    setFieldErrors({});
    setFeedback('');
    setForm({ appointment_id: searchParams.get('appointment_id') || '', client_id: '', pet_id: '', service_ids: [], amount_charged: '', payment_method: '', notes: '', evolution: '', status: 'in_progress' });
    setFormOpen(true);
  }

  const appointmentParam = searchParams.get('appointment_id') || '';
  useEffect(() => {
    if (!appointmentParam) return;
    setEditing(null);
    setForm((current) => ({ ...current, appointment_id: appointmentParam, client_id: '', pet_id: '', service_ids: [] }));
    setFormOpen(true);
  }, [appointmentParam]);

  function editAttendance(item) {
    setEditing(item);
    setFieldErrors({});
    setFeedback('');
    setForm({
      appointment_id: item.appointment_id || '',
      client_id: item.client_id || '',
      pet_id: item.pet_id || '',
      service_ids: item.services?.map((service) => String(service.id)) || [],
      amount_charged: item.amount_charged ?? '',
      payment_method: item.payment_method || '',
      notes: item.notes || '',
      evolution: item.evolution || '',
      status: item.status,
    });
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFieldErrors({});
    setFeedback('');
    let payload;
    if (editing) {
      payload = {};
      if (isVet || isAdmin) Object.assign(payload, { notes: form.notes || null, evolution: form.evolution || null, service_ids: form.service_ids.map(Number), status: form.status });
      if (isReception || isAdmin) Object.assign(payload, { amount_charged: form.amount_charged === '' ? null : Number(form.amount_charged), payment_method: form.payment_method || null });
    } else if (form.appointment_id) {
      payload = { appointment_id: Number(form.appointment_id) };
    } else {
      payload = { client_id: Number(form.client_id), pet_id: Number(form.pet_id), service_ids: form.service_ids.map(Number) };
      if (isVet || isAdmin) Object.assign(payload, { notes: form.notes || null, evolution: form.evolution || null });
      if (isReception || isAdmin) Object.assign(payload, { amount_charged: form.amount_charged === '' ? null : Number(form.amount_charged), payment_method: form.payment_method || null });
    }
    try {
      if (editing) await updateAttendance(editing.id, payload);
      else await createAttendance(payload);
      setFormOpen(false);
      setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('appointment_id'); return next; }, { replace: true });
      setFeedback(editing ? 'Atendimento atualizado.' : 'Atendimento iniciado.');
      await refresh();
    } catch (requestError) {
      const response = requestError.response;
      if (response?.status === 422) {
        setFieldErrors(response.data?.errors || {});
        setFeedback(response.data?.message || 'Revise os campos indicados.');
      } else if (response?.status === 403) {
        setFeedback('Seu perfil não pode alterar esses dados.');
      } else if (response?.status === 409) {
        setFeedback(response.data?.message || 'Este atendimento não pode ser iniciado.');
      } else {
        setFeedback('Não foi possível salvar o atendimento. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  }

  const errorFor = (field) => fieldErrors[field]?.[0];
  const hasAppointment = !!form.appointment_id && !editing;

  return (
    <section className="clients-page">
      <header className="clients-header"><div><p>Registre procedimentos, evolução clínica e pagamento.</p></div>
        {canCreate && <button type="button" className="btn btn-primary clients-new-button" onClick={startNew} disabled={loading || optionsLoading || !!optionsError}>+ Novo atendimento</button>}
      </header>
      <Toast message={feedback} />
      {optionsError && <ErrorState message={optionsError} onRetry={refresh} />}
      {formOpen && <form className="client-form-panel" onSubmit={handleSubmit}>
        <div className="client-form-header"><h2>{editing ? 'Atualizar atendimento' : 'Iniciar atendimento'}</h2>
          <p>{editing ? `${editing.pet?.name ?? 'Pet'} · ${editing.client?.name ?? 'Cliente'}` : 'Escolha um agendamento ou registre uma chegada sem horário marcado.'}</p></div>
        {!editing && <div className="client-form-grid">
          <label className="client-field"><span>Agendamento existente</span><select value={form.appointment_id} onChange={(event) => setForm((current) => ({ ...current, appointment_id: event.target.value, client_id: '', pet_id: '', service_ids: [] }))}>
            <option value="">Atendimento avulso</option>{availableAppointments.map((item) => <option key={item.id} value={item.id}>{formatDate(item.scheduled_at)} · {item.pet?.name} · {item.pet?.client?.name}</option>)}
          </select>{errorFor('appointment_id') && <span className="client-field-error" role="alert">{errorFor('appointment_id')}</span>}</label>
          {!hasAppointment && <>
            <label className="client-field"><span>Cliente *</span><select required value={form.client_id} onChange={(event) => setForm((current) => ({ ...current, client_id: event.target.value, pet_id: '' }))}><option value="">Selecione o cliente</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errorFor('client_id') && <span className="client-field-error" role="alert">{errorFor('client_id')}</span>}</label>
            <label className="client-field"><span>Pet *</span><select required value={form.pet_id} onChange={(event) => setForm((current) => ({ ...current, pet_id: event.target.value }))} disabled={!form.client_id}><option value="">Selecione o pet</option>{availablePets.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.species}</option>)}</select>{errorFor('pet_id') && <span className="client-field-error" role="alert">{errorFor('pet_id')}</span>}</label>
            <label className="client-field"><span>Serviços realizados *</span><select multiple required value={form.service_ids} onChange={(event) => setForm((current) => ({ ...current, service_ids: [...event.target.selectedOptions].map((option) => option.value) }))}>{services.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}{canViewFinance ? ` · ${currency.format(Number(item.price))}` : ''}</option>)}</select>{errorFor('service_ids') && <span className="client-field-error" role="alert">{errorFor('service_ids')}</span>}</label>
          </>}
        </div>}
        {(isVet || isAdmin) && <div className="client-form-grid">
          <label className="client-field"><span>Observações do atendimento</span><textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <label className="client-field"><span>Evolução clínica</span><textarea rows={4} value={form.evolution} onChange={(event) => setForm((current) => ({ ...current, evolution: event.target.value }))} aria-invalid={!!errorFor('evolution')} />{errorFor('evolution') && <span className="client-field-error" role="alert">{errorFor('evolution')}</span>}</label>
        </div>}
        {canViewFinance && (isReception || isAdmin) && <div className="client-form-grid">
          <label className="client-field"><span>Valor cobrado (R$)</span><input type="number" min="0" step="0.01" value={form.amount_charged} onChange={(event) => setForm((current) => ({ ...current, amount_charged: event.target.value }))} aria-invalid={!!errorFor('amount_charged')} />{errorFor('amount_charged') && <span className="client-field-error" role="alert">{errorFor('amount_charged')}</span>}</label>
          <label className="client-field"><span>Forma de pagamento</span><select value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))}><option value="">Não informado</option>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label>
        </div>}
        {editing && (isVet || isAdmin) && <label className="client-field"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="in_progress">Em atendimento</option><option value="completed">Concluído</option></select>{errorFor('status') && <span className="client-field-error" role="alert">{errorFor('status')}</span>}</label>}
        {(errorFor('appointment_id') || errorFor('service_ids.*')) && <p role="alert" className="clients-feedback clients-feedback-error">{errorFor('appointment_id') || errorFor('service_ids.*')}</p>}
        {feedback && <p role="alert" className="clients-feedback clients-feedback-error">{feedback}</p>}
        <div className="client-form-actions"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar atendimento'}</button><button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</button></div>
      </form>}
      <section className="clients-panel"><div className="clients-toolbar"><label className="clients-search-label" htmlFor="attendance-search">Buscar atendimentos</label><input id="attendance-search" className="clients-search-input" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cliente, pet, serviço ou status" /></div>
        {loading && <LoadingSkeleton label="Carregando atendimentos..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}
        {!loading && !error && attendances.length === 0 && <EmptyState message="Nenhum atendimento registrado." actionLabel={canCreate ? 'Novo atendimento' : undefined} onAction={canCreate ? startNew : undefined} />}
        {!loading && !error && attendances.length > 0 && visibleAttendances.length === 0 && <EmptyState message="Nenhum atendimento encontrado." />}
        {!loading && !error && visibleAttendances.length > 0 && <div className="clients-table-wrapper" role="region" aria-label="Tabela de atendimentos" tabIndex={0}><table className="clients-table"><thead><tr><th>Início</th><th>Cliente</th><th>Pet</th><th>Serviços</th><th>Status</th>{canViewFinance && <th>Valor cobrado</th>}<th>Ação</th></tr></thead>
          <tbody>{attendancePage.items.map((item) => <tr key={item.id}><td>{formatDate(item.started_at)}</td><td>{item.client?.name}</td><td>{item.pet?.name}</td><td>{item.services?.map((service) => service.name).join(', ')}</td><td>{item.status === 'completed' ? 'Concluído' : 'Em atendimento'}</td>{canViewFinance && <td>{item.amount_charged == null ? 'Não informado' : currency.format(Number(item.amount_charged))}</td>}<td>{canUpdate && (item.status !== 'completed' || isAdmin || isReception) && <button type="button" className="clients-action-button clients-action-edit" onClick={() => editAttendance(item)}>Atualizar</button>}</td></tr>)}</tbody>
        </table></div>}
        {!loading && !error && visibleAttendances.length > DEFAULT_PAGE_SIZE && <nav className="clients-pagination" aria-label="Paginação de atendimentos"><span>Mostrando {attendancePage.firstItem}–{attendancePage.lastItem} de {attendancePage.total}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={attendancePage.page === 1}>Anterior</button><span>Página {attendancePage.page} de {attendancePage.pageCount}</span><button type="button" className="btn btn-secondary" onClick={() => setPage((current) => Math.min(attendancePage.pageCount, current + 1))} disabled={attendancePage.page === attendancePage.pageCount}>Próxima</button></nav>}
      </section>
    </section>
  );
}
