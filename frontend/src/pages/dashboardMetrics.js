export const CLINIC_TIME_ZONE = 'America/Sao_Paulo';
const inFlightDashboardRequests = new Map();

export function countRecords(records) {
  if (!Array.isArray(records)) throw new TypeError('A resposta não é uma lista.');
  return records.length;
}

export function getClinicDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export function hasClinicDateChanged(previousDate, now = new Date()) {
  return getClinicDate(now) !== previousDate;
}

export function loadDashboardResource(resource, loader) {
  const inFlight = inFlightDashboardRequests.get(resource);
  if (inFlight) return inFlight;

  const request = Promise.resolve().then(loader);
  inFlightDashboardRequests.set(resource, request);

  const clearRequest = () => {
    if (inFlightDashboardRequests.get(resource) === request) {
      inFlightDashboardRequests.delete(resource);
    }
  };
  request.then(clearRequest, clearRequest);

  return request;
}

function getLocalDatePrefix(value) {
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})(?:T| )\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?/);
  if (!match) return null;

  const [year, month, day] = match[1].split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return null;

  return match[1];
}

export function countAppointmentsForClinicDate(appointments, clinicDate) {
  if (!Array.isArray(appointments)) throw new TypeError('A resposta não é uma lista.');
  return appointments.filter((appointment) =>
    (appointment?.status === 'scheduled' || appointment?.status === 'confirmed')
    && getLocalDatePrefix(appointment?.scheduled_at) === clinicDate,
  ).length;
}
