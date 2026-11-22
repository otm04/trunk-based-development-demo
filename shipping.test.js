import test from 'node:test';
import assert from 'node:assert/strict';
import { shippingCost } from './shipping.js';
test('shipping boundary', () => {
  assert.equal(shippingCost({ subtotal: 49 }), 5);
  assert.equal(shippingCost({ subtotal: 50 }), 0);
});
