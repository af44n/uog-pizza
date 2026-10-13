import { useEffect, useState } from "react";
import { money } from "../store.jsx";
import { staffFetch, timeOf } from "./api.js";

// What the staff button says, and which status it moves the order to
function nextStep(order) {
  switch (order.status) {
    case "received": return ["baking", "Start baking"];
    case "baking": return ["ready", "Mark ready"];
    case "ready": return order.orderType === "delivery" ? ["on-the-way", "Out for delivery"] : ["delivered", "Complete"];
    case "on-the-way": return ["delivered", "Delivered"];
    default: return null;
  }
}

const labels = { received: "New", baking: "Baking", ready: "Ready", "on-the-way": "On the way", delivered: "Done", cancelled: "Cancelled" };

export default function Orders() {
  const [scope, setScope] = useState("active");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    staffFetch("/orders?scope=" + scope)
      .then((data) => { setOrders(data); setError(""); })
      .catch((err) => setError(err.message));

  // Load now, then again every 5 seconds so new website orders appear on their own
  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [scope]);

  const setStatus = (order, status) =>
    staffFetch("/orders/" + order._id, { method: "PATCH", body: JSON.stringify({ status }) }).then(load).catch((err) => setError(err.message));

  return (
    <div className="pos-page">
      <div className="pos-page-head">
        <h2>Orders</h2>
        <div className="pos-toggle">
          <button className={scope === "active" ? "on" : ""} onClick={() => setScope("active")}>Active</button>
          <button className={scope === "today" ? "on" : ""} onClick={() => setScope("today")}>All today</button>
        </div>
      </div>

      {error && <p className="pos-bad">{error}</p>}
      {orders.length === 0 && !error && <p className="pos-empty">No orders here yet.</p>}

      <div className="pos-orders">
        {orders.map((order) => {
          const next = nextStep(order);
          return (
            <article key={order._id} className={"pos-order s-" + order.status}>
              <header>
                <strong>{order.code}</strong>
                <span className="pos-badge">{labels[order.status]}</span>
              </header>
              <p className="pos-meta">
                {timeOf(order.createdAt)} · {order.source === "online" ? "Website" : "Counter"} · {order.orderType === "delivery" ? "Delivery" : order.orderType === "dine-in" ? "Dine in" : "Takeaway"}
              </p>
              <ul>
                {order.items.map((i) => (
                  <li key={i._id}>{i.qty} × {i.name}{i.size !== "Regular" ? ` (${i.size})` : ""}</li>
                ))}
              </ul>
              {order.orderType === "delivery" && (
                <p className="pos-meta">{order.customer.name} · {order.customer.phone}<br />{order.customer.address}{order.customer.notes && <><br />Note: {order.customer.notes}</>}</p>
              )}
              <footer>
                <span>{money(order.total)} · {order.payment === "card" ? "Card" : order.payment === "cod" ? "Cash on delivery" : "Cash"}</span>
                <span className="pos-order-buttons">
                  {next && <button className="pos-btn pos-btn-main" onClick={() => setStatus(order, next[0])}>{next[1]}</button>}
                  {next && <button className="pos-btn pos-btn-ghost" onClick={() => setStatus(order, "cancelled")}>Cancel</button>}
                </span>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
