import api from "../api.js";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useCart, money } from "../store.jsx";

export default function Checkout() {
  const { items, subtotal, delivery, total, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Please fill in your name, phone number and address.");
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post("/orders", {
        customer: form,
        payment,
        items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty }))
      });

      clear();
      navigate("/order/" + data.code);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="page page-center">
        <h1 className="page-title">Your cart is empty</h1>
        <p className="muted">Add a pizza or two and come back.</p>
        <Link to="/" className="btn btn-primary">Back to the menu</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <motion.h1 className="page-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
        Checkout
      </motion.h1>

      <div className="checkout">
        <motion.form
          className="form"
          onSubmit={submit}
          noValidate
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2>Delivery details</h2>

          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={update("name")} autoComplete="name" placeholder="Ayesha Khan" />

          <label htmlFor="phone">Phone number</label>
          <input id="phone" value={form.phone} onChange={update("phone")} autoComplete="tel" inputMode="tel" placeholder="0300 1234567" />

          <label htmlFor="address">Delivery address</label>
          <input id="address" value={form.address} onChange={update("address")} autoComplete="street-address" placeholder="Hostel, room number or department" />

          <label htmlFor="notes">Notes for the kitchen <span className="muted">(optional)</span></label>
          <textarea id="notes" rows="3" value={form.notes} onChange={update("notes")} placeholder="Extra spicy, no onions…" />

          <h2>Payment</h2>
          <div className="pay-options">
            {[
              ["cod", "Cash on delivery", "Pay the rider when it arrives"],
              ["card", "Card on delivery", "The rider brings a card machine"]
            ].map(([value, title, hint]) => (
              <label key={value} className={"pay-option" + (payment === value ? " on" : "")}>
                <input type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} />
                <span><strong>{title}</strong><small>{hint}</small></span>
              </label>
            ))}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="btn btn-primary btn-wide" disabled={sending}>
            {sending ? "Placing your order…" : `Place order · ${money(total)}`}
          </button>
        </motion.form>

        <motion.aside
          className="summary"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2>Your order</h2>
          <ul>
            {items.map((item) => (
              <li key={item.key}>
                <span>{item.qty} × {item.product.name}{item.product.sized ? ` (${item.size})` : ""}</span>
                <span>{money(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="sum-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : money(delivery)}</span></div>
          <div className="sum-row sum-total"><span>Total</span><span>{money(total)}</span></div>
        </motion.aside>
      </div>
    </main>
  );
}
