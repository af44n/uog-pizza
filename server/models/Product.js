const mongoose = require("mongoose");

// One item on the menu. Pizzas come in sizes, everything else is "Regular".
const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ["Pizza", "Sides", "Drinks", "Dessert"] },
  description: { type: String, required: true },
  price: { type: Number, required: true },        // price of the Medium (or Regular) size, in Rs
  sized: { type: Boolean, default: false },        // true for pizzas
  art: { type: String, required: true },           // which SVG illustration the website draws
  tags: [String],                                  // e.g. "Spicy", "Veg", "Bestseller"
  order: { type: Number, default: 0 }              // display order
});

module.exports = mongoose.model("Product", productSchema);
