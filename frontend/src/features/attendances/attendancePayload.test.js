import test from 'node:test';
import assert from 'node:assert/strict';
import { attendancePayload } from './attendancePayload.js';

const form = {
  appointment_id: '7', client_id: '', pet_id: '', service_ids: ['2'],
  notes: 'Observação', evolution: 'Exame realizado', amount_charged: '140.00',
  payment_method: 'Pix', status: 'completed',
};

test('atendimento agendado preserva pagamento informado pela recepção sem dados clínicos', () => {
  assert.deepEqual(attendancePayload(form, null, 'receptionist'), {
    appointment_id: 7, amount_charged: 140, payment_method: 'Pix',
  });
});

test('atendimento agendado preserva evolução do veterinário sem enviar finanças', () => {
  assert.deepEqual(attendancePayload(form, null, 'veterinarian'), {
    appointment_id: 7, notes: 'Observação', evolution: 'Exame realizado',
  });
});

test('administrador salva pagamento de atendimento concluído sem repetir a transição', () => {
  const payload = attendancePayload(form, { status: 'completed' }, 'admin');
  assert.equal(payload.amount_charged, 140);
  assert.equal(payload.payment_method, 'Pix');
  assert.equal(Object.hasOwn(payload, 'status'), false);
});

test('veterinário ainda envia a transição de conclusão com a evolução', () => {
  const payload = attendancePayload(form, { status: 'in_progress' }, 'veterinarian');
  assert.equal(payload.status, 'completed');
  assert.equal(payload.evolution, 'Exame realizado');
  assert.equal(Object.hasOwn(payload, 'amount_charged'), false);
});

test('atendimento avulso mantém cliente, pet e serviços', () => {
  const payload = attendancePayload({ ...form, appointment_id: '', client_id: '3', pet_id: '4' }, null, 'admin');
  assert.equal(payload.client_id, 3);
  assert.equal(payload.pet_id, 4);
  assert.deepEqual(payload.service_ids, [2]);
  assert.equal(payload.evolution, 'Exame realizado');
  assert.equal(payload.amount_charged, 140);
});
