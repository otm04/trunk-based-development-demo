import { shippingCost } from './shipping.js';
export function checkout(subtotal) {
  return subtotal + shippingCost({ subtotal });
}
