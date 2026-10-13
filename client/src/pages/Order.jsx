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

// The tracker is a demo: it moves forward based on how long ago the order was placed.
// (A real shop would update the status from a kitchen screen.)
function stepFor(createdAt, now) {
  const seconds = (now - new Date(createdAt)) / 1000;
  if (seconds < 15) return 0;
  if (seconds < 40) return 1;
  if (seconds < 70) return 2;
  return 3;
}

export default function Order() {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch("/api/orders/" + code)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrder(data);
      })
      .catch((err) => setError(err.message || "Could not load your order."));
  }, [code]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

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

  const step = stepFor(order.createdAt, now);

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

      <ol className="tracker">
        {steps.map(([title, hint], i) => (
          <li key={title} className={i <= step ? "done" : ""}>
            <span className="dot">
              {i === step && <motion.i animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} />}
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
