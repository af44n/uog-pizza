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

// Works out the discount in Rs. Staff can give a percentage or a fixed amount, never more than the subtotal.
function priceDiscount(discount, subtotal) {
  const value = Number(discount && discount.value);
  if (!discount || !(value > 0)) return { amount: 0 };
  if (discount.type === "percent") {
    if (value > 100) throw new HttpError(400, "A discount can't be more than 100%.");
    return { type: "percent", value, amount: Math.round((subtotal * value) / 100) };
  }
  return { type: "amount", value, amount: Math.min(Math.round(value), subtotal) };
}

// Takes sold units off tracked stock (and marks the item sold out at 0). Cancelled orders put them back.
async function takeStock(lines, direction = -1) {
  for (const l of lines) {
    const p = await Product.findOneAndUpdate({ _id: l.product, stock: { $ne: null } }, { $inc: { stock: direction * l.qty } }, { new: true });
    if (p && p.stock <= 0 && p.available) await Product.updateOne({ _id: p._id }, { available: false, stock: Math.max(0, p.stock) });
    if (p && direction > 0 && p.stock > 0 && !p.available) await Product.updateOne({ _id: p._id }, { available: true });
  }
}

// Builds and saves an order. Used by the website checkout AND the staff counter,
// so both always price things the same way.
async function createOrder({ customer, items, payment, source, orderType, cashReceived, table, discount }) {
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
    if (product.stock !== null && product.stock !== undefined && product.stock < qty) {
      throw new HttpError(400, "Only " + product.stock + " left of " + product.name + ".");
    }
    const size = product.sized ? item.size || "Medium" : "Regular";
    lines.push({ product: product._id, name: product.name, size, unitPrice: unitPrice(product, size), qty });
  }

  // 2. Totals (delivery fee only applies to delivery orders)
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const deliveryFee = orderType === "delivery" && subtotal < FREE_DELIVERY_OVER ? DELIVERY_FEE : 0;
  const discountInfo = priceDiscount(discount, subtotal);
  const total = subtotal - discountInfo.amount + deliveryFee;

  if (payment === "cash" && !(Number(cashReceived) >= total)) {
    throw new HttpError(400, "The cash received is less than the total.");
  }

  // 3. Save. The short code is random, so try again in the rare case it already exists.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const order = await Order.create({
        code: "UOG-" + Math.floor(1000 + Math.random() * 9000),
        customer,
        items: lines,
        source,
        orderType,
        payment,
        cashReceived: payment === "cash" ? Number(cashReceived) : undefined,
        table: orderType === "dine-in" ? String(table || "").trim().slice(0, 10) : "",
        subtotal,
        discount: discountInfo,
        deliveryFee,
        total
      });
      await takeStock(lines);
      return order;
    } catch (err) {
      if (err.code !== 11000) throw err; // 11000 = duplicate code
    }
  }
  throw new HttpError(500, "Could not create an order code. Please try again.");
}

module.exports = { createOrder, takeStock, HttpError };
