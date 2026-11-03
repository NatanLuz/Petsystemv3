import { formatAppointmentDate, toOperationalInput } from "./appointmentDateTime.js";

export function filterAppointments(appointments, searchTerm, statusLabels) {
  const search = String(searchTerm ?? "").trim().toLowerCase();

  return appointments.filter((appointment) => [
    appointment.pet?.name,
    appointment.pet?.client?.name,
    appointment.pet?.public_code,
    appointment.service?.name,
    statusLabels[appointment.status]?.label,
    formatAppointmentDate(appointment.scheduled_at),
  ].some((value) => String(value ?? "").toLowerCase().includes(search)))
    .sort((a, b) => toOperationalInput(a.scheduled_at).localeCompare(toOperationalInput(b.scheduled_at)) || Number(a.id) - Number(b.id));
}

export function filterAppointmentsByDate(appointments, date) {
  if (!date) return appointments;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return appointments;
  return appointments.filter((appointment) => String(appointment.scheduled_at ?? '').slice(0, 10) === date);
}

export function filterAppointmentClients(clients, searchTerm) {
  const search = String(searchTerm ?? '').trim().toLocaleLowerCase('pt-BR');
  return clients.filter((client) => !search || [client.name, client.email, client.phone]
    .some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(search)));
}
