import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCurrency, formatDate, formatWallDateTime } from './formatters.js';

test('date formatters show Brazilian order without shifting wall-clock dates', () => {
  assert.equal(formatDate('2026-11-03'), '03/11/2026');
  assert.equal(formatWallDateTime('2026-11-03 09:30:00'), '03/11/2026 09:30');
  assert.equal(formatWallDateTime('2026-11-03T09:30:00.000000Z'), '03/11/2026 09:30');
  assert.equal(formatDate(null), 'Não informado');
});

test('currency formatter uses BRL and rejects invalid values safely', () => {
  assert.equal(formatCurrency('125.50'), 'R$ 125,50');
  assert.equal(formatCurrency(null), 'Não informado');
  assert.equal(formatCurrency('invalid'), 'Não informado');
});
