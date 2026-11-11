import test from 'node:test';
import assert from 'node:assert/strict';
import { clearDashboardRequests, loadDashboardResource } from './dashboardMetrics.js';

test('nova sessão não reutiliza resposta financeira pendente da sessão anterior', async () => {
  let finishAdmin;
  const admin = loadDashboardResource('session-appointments', () => new Promise(resolve => { finishAdmin = resolve; }));
  await Promise.resolve();
  clearDashboardRequests();
  const vet = loadDashboardResource('session-appointments', async () => [{ id: 1 }]);
  finishAdmin([{ id: 1, price: '50.00' }]);
  await admin;
  assert.deepEqual(await vet, [{ id: 1 }]);
});

test('resposta antiga não remove a requisição pendente da nova sessão', async () => {
  let finishOld, finishNew;
  const old = loadDashboardResource('session-pending', () => new Promise(resolve => { finishOld = resolve; }));
  await Promise.resolve();
  clearDashboardRequests();
  const current = loadDashboardResource('session-pending', () => new Promise(resolve => { finishNew = resolve; }));
  await Promise.resolve();
  finishOld([]);
  await old;
  assert.strictEqual(loadDashboardResource('session-pending', () => assert.fail('Requisição duplicada')), current);
  finishNew([{ id: 2 }]);
  assert.deepEqual(await current, [{ id: 2 }]);
});