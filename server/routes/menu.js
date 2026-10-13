const router = require("express").Router();
const Product = require("../models/Product");
const { SIZE_MULTIPLIER, FREE_DELIVERY_OVER, DELIVERY_FEE } = require("../pricing");

// GET /api/menu  ->  all products plus the pricing rules the website needs
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ order: 1 });
    res.json({ products, sizes: SIZE_MULTIPLIER, freeDeliveryOver: FREE_DELIVERY_OVER, deliveryFee: DELIVERY_FEE });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
