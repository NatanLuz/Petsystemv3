import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { listAppointments } from '../features/appointments/appointmentService';
import { listClients } from '../features/clients/clientService';
import { listPets } from '../features/pets/petService';
import { getDashboardMetrics } from './dashboardService';
import { formatCurrency, formatWallDateTime } from '../shared/formatters.js';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/feedback/Feedback';
import {
  countAppointmentsForClinicDate,
  countRecords,
  getClinicDate,
  getClinicDateTime,
  hasClinicDateChanged,
  loadDashboardResource,
} from './dashboardMetrics';

const CLINIC_DATE_CHECK_INTERVAL_MS = 60_000;

function useClinicDate() {
  const [clinicDate, setClinicDate] = useState(() => getClinicDate());

  useEffect(() => {
    let active = true;

    function checkClinicDate() {
      if (!active) return;
      const now = new Date();
      setClinicDate((currentDate) => (
        hasClinicDateChanged(currentDate, now) ? getClinicDate(now) : currentDate
      ));
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') checkClinicDate();
    }

    const intervalId = window.setInterval(checkClinicDate, CLINIC_DATE_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return clinicDate;
}

function MetricCard({ label, tone, helper, load, loadKey = 0, onClick }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, error: false, value: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: false, value: null });

    load(loadKey)
      .then((value) => {
        if (active) setState({ loading: false, error: false, value });
      })
      .catch(() => {
        if (active) setState({ loading: false, error: true, value: null });
      });

    return () => {
      active = false;
    };
  }, [attempt, load, loadKey]);

  const content = (
    <>
      <span className="metric-label">{label}</span>
      {state.loading ? (
        <strong className="metric-value" role="status">…</strong>
      ) : state.error ? (
        <div className="metric-error" role="alert">
          <span>Não foi possível carregar.</span>
          <button type="button" className="metric-retry" onClick={() => setAttempt((value) => value + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <strong className="metric-value">{state.value?.display ?? state.value}</strong>
      )}
      {!state.error && (state.value?.helper ?? helper) && <span className="metric-helper">{state.value?.helper ?? helper}</span>}
    </>
  );
  const className = `metric-card metric-card-${tone}${onClick ? ' metric-card-interactive' : ''}`;
  return onClick && !state.error
    ? <button type="button" className={className} onClick={onClick}>{content}</button>
    : <article className={className}>{content}</article>;
}

function TodayAppointments({ appointments, loading, error, clinicDate, clinicDateTime, onRetry }) {
  const todays = useMemo(() => (Array.isArray(appointments) ? appointments : [])
    .filter((appointment) => appointment?.scheduled_at?.slice(0, 10) === clinicDate
      && appointment.scheduled_at > clinicDateTime
      && ['scheduled', 'confirmed'].includes(appointment.status))
    .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))),
  [appointments, clinicDate]);

  return (
    <section className="dashboard-panel" aria-labelledby="today-appointments-title">
      <div className="dashboard-panel-header">
        <h2 id="today-appointments-title">Próximos atendimentos de hoje</h2>
        <span>{clinicDate}</span>
      </div>
      {loading ? <LoadingSkeleton label="Carregando agenda..." />
        : error ? <ErrorState message="Não foi possível carregar os atendimentos de hoje." onRetry={onRetry} />
          : todays.length === 0 ? <EmptyState message="Não há atendimentos agendados para hoje." />
            : <div className="clients-table-wrapper" role="region" aria-label="Próximos atendimentos de hoje" tabIndex={0}>
              <table className="clients-table"><thead><tr><th>Horário</th><th>Pet</th><th>Tutor</th><th>Serviço</th><th>Status</th></tr></thead>
                <tbody>{todays.map((appointment) => <tr key={appointment.id}>
                  <td>{formatWallDateTime(appointment.scheduled_at).slice(-5)}</td>
                  <td>{appointment.pet?.name || 'Pet indisponível'}</td>
                  <td>{appointment.pet?.client?.name || 'Tutor indisponível'}</td>
                  <td>{appointment.service?.name || 'Serviço indisponível'}</td>
                  <td>{appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}</td>
                </tr>)}</tbody>
              </table>
            </div>}
    </section>
  );
}

const loadClients = async () => {
  const clients = await loadDashboardResource('clients', listClients);
  return countRecords(clients);
};

const loadPets = async () => {
  const pets = await loadDashboardResource('pets', listPets);
  return countRecords(pets);
};

const loadAppointmentsToday = async (clinicDate) => {
  const appointments = await loadDashboardResource('appointments', listAppointments);
  return countAppointmentsForClinicDate(appointments, clinicDate);
};

const loadRevenue = async (clinicDate) => {
  const metrics = await loadDashboardResource('dashboard-finance', getDashboardMetrics);
  const amount = Number(metrics.revenue);
  const display = Number.isFinite(amount) ? formatCurrency(amount, metrics.currency || 'BRL') : formatCurrency(0, metrics.currency || 'BRL');
  return { display, helper: '', clinicDate };
};

export default function HomePage() {
  const clinicDate = useClinicDate();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clinicDateTime, setClinicDateTime] = useState(() => getClinicDateTime());
  const [agenda, setAgenda] = useState({ loading: true, error: false, appointments: [] });
  const [agendaRevision, setAgendaRevision] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClinicDateTime(getClinicDateTime()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;
    loadDashboardResource('appointments', listAppointments).then((appointments) => {
      if (active) setAgenda({ loading: false, error: false, appointments });
    }).catch(() => {
      if (active) setAgenda({ loading: false, error: true, appointments: [] });
    });
    return () => { active = false; };
  }, [clinicDate, agendaRevision]);

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p>Visão geral da operação do PetSystem.</p>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard label="Total de Clientes" tone="blue" helper="Clientes cadastrados" load={loadClients} onClick={() => navigate('/clients')} />
        <MetricCard label="Pets Cadastrados" tone="green" helper="Pets cadastrados" load={loadPets} onClick={() => navigate('/pets')} />
        <MetricCard label="Agendamentos de Hoje" tone="yellow" helper="Agendados e confirmados · horário local da clínica" load={loadAppointmentsToday} loadKey={clinicDate} onClick={() => navigate(`/appointments?date=${clinicDate}`)} />
        {(user?.role === 'admin' || user?.role === 'receptionist') && <MetricCard label="Faturamento no mês" tone="cyan" helper="Atendimentos concluídos" load={loadRevenue} loadKey={clinicDate} onClick={() => navigate('/attendances?status=completed')} />}
      </div>
      <TodayAppointments appointments={agenda.appointments} loading={agenda.loading} error={agenda.error} clinicDate={clinicDate} clinicDateTime={clinicDateTime} onRetry={() => { setAgenda((current) => ({ ...current, loading: true, error: false })); setAgendaRevision((value) => value + 1); }} />
    </section>
  );
}
