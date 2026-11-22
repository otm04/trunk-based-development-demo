import test from 'node:test';
import assert from 'node:assert/strict';
import { checkout } from './checkout.js';
test('checkout includes current shipping policy', () => {
  assert.equal(checkout(80), 80);
  assert.equal(checkout(40), 45);
});
