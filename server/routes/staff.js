const router = require("express").Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { createOrder, takeStock, HttpError } = require("../orderService");

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

// POST /api/staff/orders  ->  ring up an order at the counter (dine-in, takeaway, or a phone order for delivery)
router.post("/orders", async (req, res, next) => {
  try {
    const { items, payment, orderType, cashReceived, customerName, phone, address, table, notes, discount } = req.body;
    const type = ["takeaway", "delivery"].includes(orderType) ? orderType : "dine-in";

    if (type === "delivery" && (!(phone || "").trim() || !(address || "").trim())) {
      throw new HttpError(400, "A delivery order needs a phone number and an address.");
    }

    const order = await createOrder({
      customer: {
        name: (customerName || "").trim() || "Walk-in",
        phone: (phone || "").trim() || "-",
        address: type === "delivery" ? address.trim() : type === "dine-in" ? "Dine in" : "Takeaway",
        notes: (notes || "").trim()
      },
      items,
      payment: type === "delivery" && payment !== "card" ? "cod" : payment === "card" ? "card" : "cash",
      cashReceived,
      source: "counter",
      orderType: type,
      table,
      discount
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/staff/orders/:id  ->  move an order to its next status (or cancel it, with a reason)
router.patch("/orders/:id", async (req, res, next) => {
  try {
    const allowed = Order.schema.path("status").enumValues;
    if (!allowed.includes(req.body.status)) throw new HttpError(400, "Unknown status.");
    const order = await Order.findById(req.params.id);
    if (!order) throw new HttpError(404, "Order not found.");

    const wasCancelled = order.status === "cancelled";
    order.status = req.body.status;
    if (req.body.status === "cancelled") order.cancelReason = String(req.body.reason || "").trim().slice(0, 120);
    await order.save();

    // A newly cancelled order puts its items back into tracked stock
    if (req.body.status === "cancelled" && !wasCancelled) {
      await takeStock(order.items.map((i) => ({ product: i.product, qty: i.qty })), 1);
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

const DAY = 24 * 60 * 60 * 1000;
const PKT = 5 * 60 * 60 * 1000;

// Number of whole days since 1970 in Pakistan time, and the label for it
const dayIndex = (date) => Math.floor((date.getTime() + PKT) / DAY);
const dayLabel = (index) => new Date(index * DAY).toISOString().slice(0, 10);

// GET /api/staff/summary  ->  today's sales figures, plus the last 7 days and an hour-by-hour chart
router.get("/summary", async (req, res, next) => {
  try {
    const todayStart = startOfToday();
    const weekStart = new Date(todayStart.getTime() - 6 * DAY);
    const all = await Order.find({ createdAt: { $gte: weekStart } });

    const orders = all.filter((o) => o.createdAt >= todayStart && o.status !== "cancelled");
    const cancelled = all.filter((o) => o.createdAt >= todayStart && o.status === "cancelled");

    const sum = (list) => list.reduce((total, o) => total + o.total, 0);
    const group = (list) => ({ orders: list.length, revenue: sum(list) });
    const byPayment = (method) => orders.filter((o) => (method === "card" ? o.payment === "card" : o.payment !== "card"));

    // Count how many of each item were sold
    const sold = {};
    orders.forEach((o) => o.items.forEach((i) => (sold[i.name] = (sold[i.name] || 0) + i.qty)));
    const topItems = Object.entries(sold)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // Orders per hour today (hour of the day in Pakistan time)
    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, revenue: 0 }));
    orders.forEach((o) => {
      const h = new Date(o.createdAt.getTime() + PKT).getUTCHours();
      hours[h].orders += 1;
      hours[h].revenue += o.total;
    });

    // Revenue for each of the last 7 days
    const today = dayIndex(new Date());
    const week = Array.from({ length: 7 }, (_, n) => ({ date: dayLabel(today - 6 + n), orders: 0, revenue: 0 }));
    all.filter((o) => o.status !== "cancelled").forEach((o) => {
      const slot = week[dayIndex(o.createdAt) - (today - 6)];
      if (slot) {
        slot.orders += 1;
        slot.revenue += o.total;
      }
    });

    // Cash sales taken in the shop today (cash on delivery isn't in the till until the rider is back)
    const cashInDrawer = orders.filter((o) => o.payment === "cash").reduce((t, o) => t + o.total, 0);

    res.json({
      orders: orders.length,
      revenue: sum(orders),
      average: orders.length ? Math.round(sum(orders) / orders.length) : 0,
      discounts: orders.reduce((t, o) => t + (o.discount?.amount || 0), 0),
      cancelled: { orders: cancelled.length, revenue: sum(cancelled) },
      cashInDrawer,
      cash: group(orders.filter((o) => o.payment === "cash")),
      cod: group(orders.filter((o) => o.payment === "cod")),
      card: group(byPayment("card")),
      online: group(orders.filter((o) => o.source === "online")),
      counter: group(orders.filter((o) => o.source === "counter")),
      types: {
        "dine-in": group(orders.filter((o) => o.orderType === "dine-in")),
        takeaway: group(orders.filter((o) => o.orderType === "takeaway")),
        delivery: group(orders.filter((o) => o.orderType === "delivery"))
      },
      topItems,
      hours,
      week
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/staff/report.csv?days=7  ->  every order in the last N days as a spreadsheet file
router.get("/report.csv", async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 1, 1), 90);
    const since = new Date(startOfToday().getTime() - (days - 1) * DAY);
    const orders = await Order.find({ createdAt: { $gte: since } }).sort({ createdAt: 1 });

    const cell = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const rows = [["Code", "Date", "Time", "Source", "Type", "Table", "Customer", "Phone", "Items", "Subtotal", "Discount", "Delivery fee", "Total", "Payment", "Status", "Cancel reason"]];
    orders.forEach((o) => {
      const local = new Date(o.createdAt.getTime() + PKT).toISOString();
      rows.push([
        o.code, local.slice(0, 10), local.slice(11, 16), o.source, o.orderType, o.table, o.customer.name, o.customer.phone,
        o.items.map((i) => i.qty + "x " + i.name + (i.size !== "Regular" ? " (" + i.size + ")" : "")).join("; "),
        o.subtotal, o.discount?.amount || 0, o.deliveryFee, o.total, o.payment, o.status, o.cancelReason
      ]);
    });

    res.set("Content-Type", "text/csv");
    res.set("Content-Disposition", 'attachment; filename="uog-pizza-sales.csv"');
    res.send(rows.map((r) => r.map(cell).join(",")).join("\n"));
  } catch (err) {
    next(err);
  }
});

// Fields staff are allowed to change on a menu item
function productFields(body) {
  const fields = {};
  if (body.name !== undefined) fields.name = String(body.name).trim();
  if (body.price !== undefined) fields.price = Math.round(Number(body.price));
  if (body.description) fields.description = String(body.description).trim();
  if (body.available !== undefined) fields.available = !!body.available;
  if (body.stock !== undefined) fields.stock = body.stock === null || body.stock === "" ? null : Math.max(0, Math.floor(Number(body.stock)));
  if (fields.name === "" || (fields.price !== undefined && !(fields.price > 0)) || Number.isNaN(fields.stock)) {
    throw new HttpError(400, "Give the item a name and a price above zero.");
  }
  return fields;
}

// POST /api/staff/products  ->  add a new menu item
router.post("/products", async (req, res, next) => {
  try {
    const category = req.body.category;
    if (!Product.schema.path("category").enumValues.includes(category)) throw new HttpError(400, "Pick a category.");
    const fields = productFields(req.body);
    if (!fields.name || !fields.price) throw new HttpError(400, "Give the item a name and a price above zero.");

    const art = { Pizza: "margherita", Sides: "bread", Drinks: "drink-red", Dessert: "cake" }[category];
    const last = await Product.findOne().sort({ order: -1 });
    const product = await Product.create({
      description: "Fresh from the UOG Pizza kitchen.",
      ...fields,
      category,
      sized: category === "Pizza",
      art,
      slug: fields.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36),
      order: (last ? last.order : 0) + 1
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/staff/products/:id  ->  edit a menu item (name, price, stock, sold out)
router.patch("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, productFields(req.body), { new: true });
    if (!product) throw new HttpError(404, "Item not found.");
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/staff/products/:id  ->  remove a menu item (old orders keep their copy of the name and price)
router.delete("/products/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new HttpError(404, "Item not found.");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
