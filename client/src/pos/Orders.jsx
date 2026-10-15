import { useEffect, useRef, useState } from "react";
import { money } from "../store.jsx";
import { staffFetch, timeOf, typeLabel, payLabel } from "./api.js";
import Receipt from "./Receipt.jsx";

// What the staff button says, and which status it moves the order to
export function nextStep(order) {
  switch (order.status) {
    case "received": return ["baking", "Start baking"];
    case "baking": return ["ready", "Mark ready"];
    case "ready": return order.orderType === "delivery" ? ["on-the-way", "Out for delivery"] : ["delivered", "Complete"];
    case "on-the-way": return ["delivered", "Delivered"];
    default: return null;
  }
}

export const labels = { received: "New", baking: "Baking", ready: "Ready", "on-the-way": "On the way", delivered: "Done", cancelled: "Cancelled" };

// "7 min ago", turns red when an order has been waiting a long time
export const minutesSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / 60000));

const reasons = ["Customer changed mind", "Wrong order", "Out of an ingredient", "Could not deliver"];

// Loads orders now and every 5 seconds, so new website orders appear on their own
export function useOrders(scope) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const load = () =>
    staffFetch("/orders", { params: { scope } })
      .then((data) => { setOrders(data); setError(""); })
      .catch((err) => setError(err.message));
  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [scope]);
  return { orders, error, setError, load };
}

export async function updateStatus(order, status, reason) {
  return staffFetch("/orders/" + order._id, { method: "PATCH", data: { status, reason } });
}

export default function Orders() {
  const [scope, setScope] = useState("active");
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const { orders, error, setError, load } = useOrders(scope);
  const [receipt, setReceipt] = useState(null);
  const [cancelling, setCancelling] = useState(null);   // the order being cancelled, waiting for a reason
  const [reason, setReason] = useState("");

  const setStatus = (order, status, why) => updateStatus(order, status, why).then(load).catch((err) => setError(err.message));

  function confirmCancel() {
    setStatus(cancelling, "cancelled", reason);
    setCancelling(null);
    setReason("");
  }

  const q = search.trim().toLowerCase();
  const shown = orders.filter(
    (o) =>
      (source === "all" || o.source === source) &&
      (!q || [o.code, o.customer.name, o.customer.phone, o.table && "table " + o.table].some((v) => v && v.toLowerCase().includes(q)))
  );

  return (
    <div className="pos-page">
      <div className="pos-page-head">
        <h2>Orders</h2>
        <div className="pos-filters">
          <input className="pos-input" type="search" placeholder="Search code, name, phone…" aria-label="Search orders" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="pos-toggle">
            {[["all", "All"], ["online", "Website"], ["counter", "Counter"]].map(([v, label]) => (
              <button key={v} className={source === v ? "on" : ""} onClick={() => setSource(v)}>{label}</button>
            ))}
          </div>
          <div className="pos-toggle">
            <button className={scope === "active" ? "on" : ""} onClick={() => setScope("active")}>Active</button>
            <button className={scope === "today" ? "on" : ""} onClick={() => setScope("today")}>All today</button>
          </div>
        </div>
      </div>

      {error && <p className="pos-bad">{error}</p>}
      {shown.length === 0 && !error && <p className="pos-empty">No orders here yet.</p>}

      <div className="pos-orders">
        {shown.map((order) => {
          const next = nextStep(order);
          const waiting = next ? minutesSince(order.createdAt) : 0;
          return (
            <article key={order._id} className={"pos-order s-" + order.status}>
              <header>
                <strong>{order.code}</strong>
                <span className="pos-badge">{labels[order.status]}</span>
              </header>
              <p className="pos-meta">
                {timeOf(order.createdAt)}
                {next && <span className={waiting >= 20 ? "pos-bad" : ""}> ({waiting} min ago)</span>} · {order.source === "online" ? "Website" : "Counter"} · {typeLabel[order.orderType]}
                {order.table && ` · Table ${order.table}`}
              </p>
              <ul>
                {order.items.map((i) => (
                  <li key={i._id}>{i.qty} × {i.name}{i.size !== "Regular" ? ` (${i.size})` : ""}</li>
                ))}
              </ul>
              {order.customer.notes && <p className="pos-note-box">Note: {order.customer.notes}</p>}
              {order.orderType === "delivery" && (
                <p className="pos-meta">{order.customer.name} · <a href={"tel:" + order.customer.phone}>{order.customer.phone}</a><br />{order.customer.address}</p>
              )}
              {order.status === "cancelled" && order.cancelReason && <p className="pos-meta">Reason: {order.cancelReason}</p>}
              <footer>
                <span>
                  {money(order.total)} · {payLabel[order.payment]}
                  {order.discount?.amount > 0 && <small className="pos-note"> (−{money(order.discount.amount)} off)</small>}
                </span>
                <span className="pos-order-buttons">
                  <button className="pos-btn pos-btn-ghost" onClick={() => setReceipt(order)}>Receipt</button>
                  {next && <button className="pos-btn pos-btn-main" onClick={() => setStatus(order, next[0])}>{next[1]}</button>}
                  {next && <button className="pos-btn pos-btn-ghost" onClick={() => setCancelling(order)}>Cancel</button>}
                </span>
              </footer>
            </article>
          );
        })}
      </div>

      {cancelling && (
        <div className="pos-overlay" onClick={() => setCancelling(null)}>
          <div className="pos-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel {cancelling.code}?</h3>
            <p className="pos-meta">The items go back into stock and the order leaves today's sales.</p>
            <div className="pos-quick">
              {reasons.map((r) => (
                <button key={r} className={reason === r ? "on" : ""} onClick={() => setReason(r)}>{r}</button>
              ))}
            </div>
            <input className="pos-input" placeholder="Or type a reason" aria-label="Cancel reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="pos-actions">
              <button className="pos-btn pos-btn-ghost" onClick={() => setCancelling(null)}>Keep order</button>
              <button className="pos-btn pos-btn-main" onClick={confirmCancel}>Cancel order</button>
            </div>
          </div>
        </div>
      )}

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
