import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countAppointmentsForClinicDate,
  countRecords,
  getClinicDate,
  hasClinicDateChanged,
  loadDashboardResource,
} from './dashboardMetrics.js';

test('counts real client and pet list sizes, including zero records', () => {
  assert.equal(countRecords([{ id: 1 }, { id: 2 }]), 2);
  assert.equal(countRecords([]), 0);
  assert.throws(() => countRecords({ data: [] }), TypeError);
});

test('clinic date follows America/Sao_Paulo around local midnight', () => {
  assert.equal(getClinicDate(new Date('2026-10-13T02:59:00.000Z')), '2026-10-12');
  assert.equal(getClinicDate(new Date('2026-10-13T03:00:00.000Z')), '2026-10-13');
  assert.equal(hasClinicDateChanged('2026-10-12', new Date('2026-10-13T02:59:00.000Z')), false);
  assert.equal(hasClinicDateChanged('2026-10-12', new Date('2026-10-13T03:00:00.000Z')), true);
});

test('shares simultaneous requests and clears the shared reference after success', async () => {
  let resolveRequest;
  let calls = 0;
  const request = new Promise((resolve) => { resolveRequest = resolve; });
  const loader = () => {
    calls += 1;
    return request;
  };

  const first = loadDashboardResource('test-success', loader);
  const simultaneous = loadDashboardResource('test-success', loader);
  assert.strictEqual(first, simultaneous);

  await Promise.resolve();
  assert.equal(calls, 1);
  resolveRequest(['result']);
  assert.deepEqual(await first, ['result']);

  const later = loadDashboardResource('test-success', async () => {
    calls += 1;
    return ['fresh'];
  });
  assert.deepEqual(await later, ['fresh']);
  assert.equal(calls, 2);
});

test('clears failed shared requests so a later attempt can retry', async () => {
  let calls = 0;
  const failure = new Error('request failed');
  const loader = () => {
    calls += 1;
    return Promise.reject(failure);
  };

  const first = loadDashboardResource('test-failure', loader);
  const simultaneous = loadDashboardResource('test-failure', loader);
  assert.strictEqual(first, simultaneous);
  await assert.rejects(first, failure);

  const retry = loadDashboardResource('test-failure', async () => {
    calls += 1;
    return ['recovered'];
  });
  assert.deepEqual(await retry, ['recovered']);
  assert.equal(calls, 2);
});

test('counts local day boundaries without shifting scheduled wall-clock values', () => {
  const appointments = [
    { scheduled_at: '2026-10-12 23:59:00', status: 'scheduled' },
    { scheduled_at: '2026-10-13T00:00:00.000000Z', status: 'confirmed' },
    { scheduled_at: '2026-10-13 10:00:00', status: 'scheduled' },
    { scheduled_at: '2026-10-13 23:59:59', status: 'confirmed' },
    { scheduled_at: '2026-10-14 00:00:00', status: 'scheduled' },
  ];

  assert.equal(countAppointmentsForClinicDate(appointments, '2026-10-13'), 3);
});

test('excludes cancelled, unknown status, and malformed dates', () => {
  const appointments = [
    { scheduled_at: '2026-10-13 10:00:00', status: 'cancelled' },
    { scheduled_at: '2026-10-13 11:00:00', status: 'completed' },
    { scheduled_at: 'invalid-date', status: 'scheduled' },
    { scheduled_at: '2026-02-30 12:00:00', status: 'confirmed' },
  ];

  assert.equal(countAppointmentsForClinicDate(appointments, '2026-10-13'), 0);
});
