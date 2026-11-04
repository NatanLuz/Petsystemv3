import assert from 'node:assert/strict';
import test from 'node:test';
import { digitsOnly, formatPhone, normalizeEmail } from './contactFormat.js';

test('phone display mask handles Brazilian landline and mobile formats', () => {
  assert.equal(formatPhone('11988887777'), '(11) 98888-7777');
  assert.equal(formatPhone('(11) 3333-2222'), '(11) 3333-2222');
  assert.equal(digitsOnly('(11) 98888-7777'), '11988887777');
});

test('email is trimmed and lowercased; blank email becomes null', () => {
  assert.equal(normalizeEmail('  ANA@EXAMPLE.COM  '), 'ana@example.com');
  assert.equal(normalizeEmail('  '), null);
});
