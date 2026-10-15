import api from "../api.js";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { money } from "../store.jsx";

const steps = [
  ["Received", "We have your order"],
  ["In the oven", "Being stretched and baked"],
  ["On the way", "Rider is heading to you"],
  ["Delivered", "Enjoy"]
];

// Which step of the tracker each status from the database lights up
const stepOf = { received: 0, baking: 1, ready: 1, "on-the-way": 2, delivered: 3 };

export default function Order() {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  // Load the order, then check again every 5 seconds so the tracker follows what staff do on the POS
  useEffect(() => {
    const load = () =>
      api
        .get("/orders/" + code)
        .then((res) => setOrder(res.data))
        .catch((err) => setError(err.message || "Could not load your order."));
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [code]);

  if (error) {
    return (
      <main className="page page-center">
        <h1 className="page-title">Order not found</h1>
        <p className="muted">{error}</p>
        <Link to="/" className="btn btn-primary">Back home</Link>
      </main>
    );
  }
  if (!order) return <main className="page page-center"><p className="muted">Loading your order…</p></main>;

  const cancelled = order.status === "cancelled";
  const step = stepOf[order.status] ?? 0;

  return (
    <main className="page page-center order-page">
      <motion.svg viewBox="0 0 120 120" className="tick" aria-hidden="true">
        <motion.circle cx="60" cy="60" r="52" fill="none" stroke="var(--gold)" strokeWidth="5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
        <motion.path d="M36,62 L54,80 L86,42" fill="none" stroke="var(--gold)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 1.1, ease: "easeOut" }} />
      </motion.svg>

      <motion.h1 className="page-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }}>
        Order placed
      </motion.h1>
      <p className="order-code">{order.code}</p>
      <p className="muted">Thanks, {order.customer.name.split(" ")[0]}. We're on it.</p>

      {cancelled && <p className="form-error">This order was cancelled. Please call us if that's a mistake.</p>}

      <ol className="tracker">
        {steps.map(([title, hint], i) => (
          <li key={title} className={!cancelled && i <= step ? "done" : ""}>
            <span className="dot">
              {i === step && !cancelled && <motion.i animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} />}
            </span>
            <strong>{title}</strong>
            <small>{hint}</small>
          </li>
        ))}
        <div className="tracker-line">
          <motion.div className="tracker-fill" animate={{ width: (step / (steps.length - 1)) * 100 + "%" }} transition={{ duration: 1.2 }} />
        </div>
      </ol>

      <div className="receipt">
        <ul>
          {order.items.map((item) => (
            <li key={item._id}>
              <span>{item.qty} × {item.name}{item.size !== "Regular" ? ` (${item.size})` : ""}</span>
              <span>{money(item.unitPrice * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="sum-row"><span>Delivery</span><span>{order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)}</span></div>
        <div className="sum-row sum-total"><span>Total ({order.payment === "cod" ? "cash" : "card"} on delivery)</span><span>{money(order.total)}</span></div>
        <p className="muted receipt-address">Delivering to {order.customer.address}</p>
      </div>

      <Link to="/" className="btn btn-ghost">Order something else</Link>
    </main>
  );
}
