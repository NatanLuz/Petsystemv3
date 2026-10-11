import test from 'node:test';
import assert from 'node:assert/strict';
import { can } from './permissions.js';

// Independent business matrix: view, create, update, delete.
const expected = {
  admin: { clients: '1111', pets: '1111', services: '1111', appointments: '1111' },
  receptionist: { clients: '1111', pets: '1111', services: '1000', appointments: '1110' },
  veterinarian: { clients: '1110', pets: '1110', services: '1000', appointments: '1110' },
};

for (const [role, modules] of Object.entries(expected)) {
  for (const [module, access] of Object.entries(modules)) {
    ['view', 'create', 'update', 'delete'].forEach((action, index) => {
      test(`${role}: ${module}.${action}`, () => {
        assert.equal(can({ role, active: true }, `${module}.${action}`), access[index] === '1');
      });
    });
  }
}

test('missing, inactive and unknown identities are denied for every capability', () => {
  for (const user of [null, undefined, {}, { role: 'admin' },
    { role: 'admin', active: false }, { role: 'admin', active: 'true' },
    { role: 'admin', active: 1 }, { role: 'unknown', active: true },
    { role: 'constructor', active: true }]) {
    for (const module of Object.keys(expected.admin)) {
      for (const action of ['view', 'create', 'update', 'delete']) {
        assert.equal(can(user, `${module}.${action}`), false);
      }
    }
  }
});

test('unknown and inherited capabilities are denied even to admin', () => {
  for (const capability of [undefined, null, {}, '', 'users.delete', 'services.activate',
    'constructor', '__proto__', 'toString']) {
    assert.equal(can({ role: 'admin', active: true }, capability), false);
  }
});

test('permissions follow the latest identity without caching previous grants', () => {
  const user = { role: 'admin', active: true };
  assert.equal(can(user, 'services.update'), true);
  user.role = 'receptionist';
  assert.equal(can(user, 'services.update'), false);
  assert.equal(can(user, 'services.view'), true);
  user.active = false;
  assert.equal(can(user, 'services.view'), false);
});
