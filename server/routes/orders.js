const router = require("express").Router();
const Order = require("../models/Order");
const { createOrder, HttpError } = require("../orderService");

// POST /api/orders  ->  a customer places an order on the website
router.post("/", async (req, res, next) => {
  try {
    const { customer, items, payment } = req.body;

    if (!customer || !customer.name?.trim() || !customer.phone?.trim() || !customer.address?.trim()) {
      throw new HttpError(400, "Please fill in your name, phone number and address.");
    }
    if (!/^[0-9+\-\s]{7,16}$/.test(customer.phone.trim())) {
      throw new HttpError(400, "That phone number doesn't look right.");
    }

    const order = await createOrder({
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        notes: (customer.notes || "").trim()
      },
      items,
      payment: payment === "card" ? "card" : "cod",
      source: "online",
      orderType: "delivery"
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
    if (!order) throw new HttpError(404, "We couldn't find that order.");
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
