const router = require("express").Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const { FREE_DELIVERY_OVER, DELIVERY_FEE, unitPrice } = require("../pricing");

// POST /api/orders  ->  place a new order
router.post("/", async (req, res, next) => {
  try {
    const { customer, items, payment } = req.body;

    // 1. Validate the customer details
    if (!customer || !customer.name?.trim() || !customer.phone?.trim() || !customer.address?.trim()) {
      return res.status(400).json({ error: "Please fill in your name, phone number and address." });
    }
    if (!/^[0-9+\-\s]{7,16}$/.test(customer.phone.trim())) {
      return res.status(400).json({ error: "That phone number doesn't look right." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    // 2. Look every product up in the database and price it ourselves
    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
    const lines = [];
    for (const item of items) {
      const product = products.find((p) => String(p._id) === String(item.productId));
      const qty = Math.floor(Number(item.qty));
      if (!product || !(qty >= 1 && qty <= 20)) {
        return res.status(400).json({ error: "One of the items in your cart is no longer available." });
      }
      const size = product.sized ? item.size || "Medium" : "Regular";
      lines.push({ product: product._id, name: product.name, size, unitPrice: unitPrice(product, size), qty });
    }

    // 3. Work out the totals
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
    const deliveryFee = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

    // 4. Save the order
    const order = await Order.create({
      code: "UOG-" + Math.floor(1000 + Math.random() * 9000),
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes || ""
      },
      items: lines,
      payment: payment === "card" ? "card" : "cod",
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:code  ->  look an order up by its code (used by the confirmation page)
router.get("/:code", async (req, res, next) => {
  try {
    const order = await Order.findOne({ code: req.params.code.toUpperCase() });
    if (!order) return res.status(404).json({ error: "We couldn't find that order." });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
