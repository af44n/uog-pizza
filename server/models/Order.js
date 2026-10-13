const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },   // short code shown to the customer, e.g. UOG-4821
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      notes: { type: String, default: "", trim: true }
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        size: String,
        unitPrice: Number,
        qty: Number
      }
    ],
    payment: { type: String, enum: ["cod", "card"], default: "cod" },
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    status: {
      type: String,
      enum: ["received", "baking", "on-the-way", "delivered"],
      default: "received"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
