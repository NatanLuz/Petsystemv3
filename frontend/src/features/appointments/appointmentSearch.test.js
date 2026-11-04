import assert from "node:assert/strict";
import test from "node:test";
import { filterAppointmentClients, filterAppointments, filterAppointmentsByDate } from "./appointmentSearch.js";

const statuses = {
  scheduled: { label: "Agendado" },
  confirmed: { label: "Confirmado" },
};

const appointments = [
  { id: 2, scheduled_at: "2026-10-13 11:00:00", status: "confirmed", pet: { name: "Rex", public_code: "123456", client: { name: "Ana Souza" } }, service: { name: "Consulta" } },
  { id: 1, scheduled_at: "2026-10-13 10:00:00", status: "scheduled", pet: { name: "Mimi", public_code: "654321", client: { name: "Bia Lima" } }, service: { name: "Vacina" } },
];

test("appointment search matches pet, tutor, code, service, status, and local date", () => {
  for (const term of ["REX", "ANA", "123456", "CONSULTA", "CONFIRMADO", "13/10/2026 11:00"]) {
    assert.deepEqual(filterAppointments(appointments, term, statuses).map(({ id }) => id), [2]);
  }
});

test("appointment results retain local-time ordering and use id as a tie breaker", () => {
  const sameTime = [
    { ...appointments[0], id: 5, scheduled_at: "2026-10-13 10:00:00" },
    { ...appointments[1], id: 3 },
  ];

  assert.deepEqual(filterAppointments(sameTime, "", statuses).map(({ id }) => id), [1, 3, 5].filter((id) => sameTime.some((appointment) => appointment.id === id)));
});

test("appointment list can be filtered by clinic wall date", () => {
  assert.deepEqual(filterAppointmentsByDate(appointments, "2026-10-13").map(({ id }) => id), [2, 1]);
  assert.deepEqual(filterAppointmentsByDate(appointments, "2026-10-14"), []);
  assert.deepEqual(filterAppointmentsByDate(appointments, ""), appointments);
});

test('appointment tutor search matches name, phone and email while retaining all clients for a blank query', () => {
  const clients = [
    { id: 1, name: 'Ana Souza', email: 'ana@example.test', phone: '11987654321' },
    { id: 2, name: 'Bruno Lima', email: null, phone: '1133332222' },
  ];
  assert.deepEqual(filterAppointmentClients(clients, 'ana').map(({ id }) => id), [1]);
  assert.deepEqual(filterAppointmentClients(clients, '3333').map(({ id }) => id), [2]);
  assert.deepEqual(filterAppointmentClients(clients, 'EXAMPLE.TEST').map(({ id }) => id), [1]);
  assert.deepEqual(filterAppointmentClients(clients, '  '), clients);
});
