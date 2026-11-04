import test from 'node:test';
import assert from 'node:assert/strict';
import { isSessionScopedApiRequest } from './sessionRequests.js';

test('session expiration handling covers every authenticated API resource', () => {
  for (const path of [
    '/clients', '/pets/3', '/services', '/appointments?date=2026-11-04',
    '/attendances', '/attendances/7', '/dashboard/metrics',
  ]) {
    assert.equal(isSessionScopedApiRequest(path), true, path);
  }
});

test('authentication and public health requests are not treated as resource requests', () => {
  for (const path of ['/login', '/logout', '/user', '/health/live', '/health/ready', '/sanctum/csrf-cookie']) {
    assert.equal(isSessionScopedApiRequest(path), false, path);
  }
});

test('invalid URLs are ignored safely', () => {
  for (const path of [undefined, null, {}, '']) {
    assert.equal(isSessionScopedApiRequest(path), false);
  }
});
