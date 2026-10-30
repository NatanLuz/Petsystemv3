import React, { useEffect, useState } from 'react';
import { listAppointments } from '../features/appointments/appointmentService';
import { listClients } from '../features/clients/clientService';
import { listPets } from '../features/pets/petService';
import {
  countAppointmentsForClinicDate,
  countRecords,
  getClinicDate,
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

function MetricCard({ label, tone, helper, load, loadKey = 0 }) {
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

  return (
    <article className={`metric-card metric-card-${tone}`}>
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
        <strong className="metric-value">{state.value}</strong>
      )}
      {!state.error && <span className="metric-helper">{helper}</span>}
    </article>
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

export default function HomePage() {
  const clinicDate = useClinicDate();

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p>Visão geral da operação do PetSystem.</p>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard label="Total de Clientes" tone="blue" helper="Clientes cadastrados" load={loadClients} />
        <MetricCard label="Pets Cadastrados" tone="green" helper="Pets cadastrados" load={loadPets} />
        <MetricCard label="Agendamentos de Hoje" tone="yellow" helper="Agendados e confirmados · horário local da clínica" load={loadAppointmentsToday} loadKey={clinicDate} />
      </div>
    </section>
  );
}
