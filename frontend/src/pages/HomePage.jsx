import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { can } from '../features/auth/permissions';
import { listAppointments } from '../features/appointments/appointmentService';
import { listAttendances } from '../features/attendances/attendanceService';
import { listClients } from '../features/clients/clientService';
import { listPets } from '../features/pets/petService';
import { getDashboardMetrics } from './dashboardService';
import { formatCurrency, formatDate, formatWallDateTime } from '../shared/formatters.js';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/feedback/Feedback';
import {
  countAppointmentsForClinicDate,
  countRecords,
  getClinicDate,
  getClinicDateTime,
  getRevenueLastSevenDays,
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

function TodayAppointments({ appointments, loading, error, clinicDate, clinicDateTime, canStartAttendance, onRetry }) {
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
        <span>{formatDate(clinicDate)}</span>
      </div>
      {loading ? <LoadingSkeleton label="Carregando agenda..." />
        : error ? <ErrorState message="Não foi possível carregar os atendimentos de hoje." onRetry={onRetry} />
          : todays.length === 0 ? <EmptyState message="Não há atendimentos agendados para hoje." />
            : <div className="clients-table-wrapper" role="region" aria-label="Próximos atendimentos de hoje" tabIndex={0}>
              <table className="clients-table"><thead><tr><th>Horário</th><th>Pet</th><th>Tutor</th><th>Serviço</th><th>Status</th><th>Ação</th></tr></thead>
                <tbody>{todays.map((appointment) => <tr key={appointment.id}>
                  <td>{formatWallDateTime(appointment.scheduled_at).slice(-5)}</td>
                  <td>{appointment.pet?.name || 'Pet indisponível'}</td>
                  <td>{appointment.pet?.client?.name || 'Tutor indisponível'}</td>
                  <td>{appointment.service?.name || 'Serviço indisponível'}</td>
                  <td>{appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}</td>
                  <td>{canStartAttendance && appointment.status === 'confirmed'
                    ? <Link className="clients-action-button clients-action-edit" to={`/attendances?appointment_id=${appointment.id}`}>Iniciar atendimento</Link>
                    : <Link className="clients-action-button clients-action-edit" to={`/appointments?date=${clinicDate}`}>Abrir agenda</Link>}</td>
                </tr>)}</tbody>
              </table>
            </div>}
    </section>
  );
}

function RevenueChart({ clinicDate }) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, error: false, values: [] });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: false, values: [] });
    loadDashboardResource('dashboard-revenue-series', listAttendances)
      .then((rows) => {
        if (!Array.isArray(rows)) throw new TypeError('Invalid attendance response.');
        if (active) setState({ loading: false, error: false, values: getRevenueLastSevenDays(rows) });
      })
      .catch(() => { if (active) setState({ loading: false, error: true, values: [] }); });
    return () => { active = false; };
  }, [clinicDate, revision]);

  const max = Math.max(0, ...state.values.map(({ total }) => total));
  const chartHeight = 128;
  const barWidth = 42;
  const points = state.values.map((item, index) => {
    const x = 38 + index * 91;
    const height = max > 0 ? Math.max(item.total > 0 ? 3 : 0, item.total / max * chartHeight) : 0;
    return { ...item, x, y: 160 - height, height };
  });

  return (
    <section className="dashboard-panel revenue-chart-panel" aria-labelledby="revenue-chart-title">
      <div className="dashboard-panel-header"><div><h2 id="revenue-chart-title">Faturamento nos últimos 7 dias</h2><p>Somente atendimentos concluídos</p></div></div>
      {state.loading ? <LoadingSkeleton label="Carregando faturamento dos últimos sete dias..." rows={2} />
        : state.error ? <ErrorState message="Não foi possível carregar o gráfico de faturamento." onRetry={() => setRevision((value) => value + 1)} />
          : <div className="revenue-chart-scroll"><svg className="revenue-chart" viewBox="0 0 700 208" role="img" aria-label="Faturamento por dia nos últimos sete dias">
            <line x1="24" y1="160" x2="678" y2="160" className="revenue-chart-axis" />
            {points.map((point) => <g key={point.date}>
              <title>{`${formatDate(point.date)}: ${formatCurrency(point.total)}`}</title>
              <rect x={point.x} y={point.y} width={barWidth} height={point.height} rx="6" className="revenue-chart-bar" />
              <text x={point.x + barWidth / 2} y="184" textAnchor="middle" className="revenue-chart-date">{formatDate(point.date).slice(0, 5)}</text>
              <text x={point.x + barWidth / 2} y={Math.max(18, point.y - 7)} textAnchor="middle" className="revenue-chart-value">{formatCurrency(point.total)}</text>
            </g>)}
          </svg></div>}
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
  const canStartAttendance = can(user, 'attendances.create');
  const canViewFinance = can(user, 'dashboard.finance.view');
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
      </div>
      {(user?.role === 'admin' || user?.role === 'receptionist') && (
        <div className="dashboard-finance-grid">
          <MetricCard label="Faturamento no mês" tone="cyan" helper="Atendimentos concluídos" load={loadRevenue} loadKey={clinicDate} onClick={() => navigate('/attendances?status=completed')} />
          {canViewFinance && <RevenueChart clinicDate={clinicDate} />}
        </div>
      )}
      <TodayAppointments appointments={agenda.appointments} loading={agenda.loading} error={agenda.error} clinicDate={clinicDate} clinicDateTime={clinicDateTime} canStartAttendance={canStartAttendance} onRetry={() => { setAgenda((current) => ({ ...current, loading: true, error: false })); setAgendaRevision((value) => value + 1); }} />
    </section>
  );
}
