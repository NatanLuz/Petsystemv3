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
