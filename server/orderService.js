const Product = require("./models/Product");
const Order = require("./models/Order");
const { FREE_DELIVERY_OVER, DELIVERY_FEE, unitPrice } = require("./pricing");

// An error that carries an HTTP status, so routes can send it straight back to the browser
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Builds and saves an order. Used by the website checkout AND the staff counter,
// so both always price things the same way.
async function createOrder({ customer, items, payment, source, orderType, cashReceived }) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, "The order is empty.");

  // 1. Look every product up in the database and price it ourselves
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const lines = [];
  for (const item of items) {
    const product = products.find((p) => String(p._id) === String(item.productId));
    const qty = Math.floor(Number(item.qty));
    if (!product || !(qty >= 1 && qty <= 20)) {
      throw new HttpError(400, "One of the items is no longer available.");
    }
    if (!product.available) throw new HttpError(400, product.name + " is sold out right now.");
    const size = product.sized ? item.size || "Medium" : "Regular";
    lines.push({ product: product._id, name: product.name, size, unitPrice: unitPrice(product, size), qty });
  }

  // 2. Totals (delivery fee only applies to delivery orders)
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const deliveryFee = orderType === "delivery" && subtotal < FREE_DELIVERY_OVER ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  if (payment === "cash" && !(Number(cashReceived) >= total)) {
    throw new HttpError(400, "The cash received is less than the total.");
  }

  // 3. Save. The short code is random, so try again in the rare case it already exists.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await Order.create({
        code: "UOG-" + Math.floor(1000 + Math.random() * 9000),
        customer,
        items: lines,
        source,
        orderType,
        payment,
        cashReceived: payment === "cash" ? Number(cashReceived) : undefined,
        subtotal,
        deliveryFee,
        total
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // 11000 = duplicate code
    }
  }
  throw new HttpError(500, "Could not create an order code. Please try again.");
}

module.exports = { createOrder, HttpError };
