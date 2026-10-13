// Pizza sizes and their price multipliers. The server always works out prices itself,
// so a customer can never change a price by editing the request.
const SIZE_MULTIPLIER = { Small: 0.75, Medium: 1, Large: 1.4 };
const FREE_DELIVERY_OVER = 3000;
const DELIVERY_FEE = 150;

function unitPrice(product, size) {
  if (!product.sized) return product.price;
  return Math.round(product.price * (SIZE_MULTIPLIER[size] || 1));
}

module.exports = { SIZE_MULTIPLIER, FREE_DELIVERY_OVER, DELIVERY_FEE, unitPrice };
