const router = require("express").Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { createOrder, HttpError } = require("../orderService");

// The staff PIN. Set POS_PIN on Vercel; "1234" is only the fallback for local development.
const PIN = process.env.POS_PIN || "1234";

// POST /api/staff/login  ->  check the PIN
router.post("/login", (req, res) => {
  if (req.body.pin !== PIN) return res.status(401).json({ error: "Wrong PIN." });
  res.json({ ok: true });
});

// Every route below needs the PIN in the x-staff-pin header
router.use((req, res, next) => {
  if (req.get("x-staff-pin") !== PIN) return res.status(401).json({ error: "Staff PIN required." });
  next();
});

// "Today" starts at midnight in Pakistan time (UTC+5)
function startOfToday() {
  const offset = 5 * 60 * 60 * 1000;
  const day = 24 * 60 * 60 * 1000;
  return new Date(Math.floor((Date.now() + offset) / day) * day - offset);
}

// GET /api/staff/orders?scope=active|today
router.get("/orders", async (req, res, next) => {
  try {
    const filter =
      req.query.scope === "today"
        ? { createdAt: { $gte: startOfToday() } }
        : { status: { $nin: ["delivered", "cancelled"] } };
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// POST /api/staff/orders  ->  ring up an order at the counter
router.post("/orders", async (req, res, next) => {
  try {
    const { items, payment, orderType, cashReceived, customerName } = req.body;
    const type = orderType === "takeaway" ? "takeaway" : "dine-in";

    const order = await createOrder({
      customer: {
        name: (customerName || "").trim() || "Walk-in",
        phone: "-",
        address: type === "dine-in" ? "Dine in" : "Takeaway"
      },
      items,
      payment: payment === "card" ? "card" : "cash",
      cashReceived,
      source: "counter",
      orderType: type
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/staff/orders/:id  ->  move an order to its next status (or cancel it)
router.patch("/orders/:id", async (req, res, next) => {
  try {
    const allowed = Order.schema.path("status").enumValues;
    if (!allowed.includes(req.body.status)) throw new HttpError(400, "Unknown status.");
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) throw new HttpError(404, "Order not found.");
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/staff/summary  ->  today's sales figures
router.get("/summary", async (req, res, next) => {
  try {
    const orders = await Order.find({ createdAt: { $gte: startOfToday() }, status: { $ne: "cancelled" } });

    const sum = (list) => list.reduce((total, o) => total + o.total, 0);
    const byPayment = (method) => orders.filter((o) => (method === "card" ? o.payment === "card" : o.payment !== "card"));

    // Count how many of each item were sold
    const sold = {};
    orders.forEach((o) => o.items.forEach((i) => (sold[i.name] = (sold[i.name] || 0) + i.qty)));
    const topItems = Object.entries(sold)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    res.json({
      orders: orders.length,
      revenue: sum(orders),
      average: orders.length ? Math.round(sum(orders) / orders.length) : 0,
      cash: { orders: byPayment("cash").length, revenue: sum(byPayment("cash")) },
      card: { orders: byPayment("card").length, revenue: sum(byPayment("card")) },
      online: { orders: orders.filter((o) => o.source === "online").length, revenue: sum(orders.filter((o) => o.source === "online")) },
      counter: { orders: orders.filter((o) => o.source === "counter").length, revenue: sum(orders.filter((o) => o.source === "counter")) },
      topItems
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/staff/products/:id  ->  mark a menu item available or sold out
router.patch("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { available: !!req.body.available }, { new: true });
    if (!product) throw new HttpError(404, "Item not found.");
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
