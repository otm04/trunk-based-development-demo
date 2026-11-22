export function shippingCost({ subtotal }) {
  return subtotal >= 50 ? 0 : 5;
}
