import { labels, nextStep, minutesSince, updateStatus, useOrders } from "./Orders.jsx";
import { typeLabel } from "./api.js";

// A big-text board for the kitchen screen: new orders on the left, baking in the middle, ready on the right
const columns = [["received", "New"], ["baking", "Baking"], ["ready", "Ready"]];

export default function Kitchen() {
  const { orders, error, setError, load } = useOrders("active");

  const move = (order, status) => updateStatus(order, status).then(load).catch((err) => setError(err.message));
  // Oldest first, so nothing gets forgotten
  const inColumn = (status) => orders.filter((o) => o.status === status).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="pos-page pos-wide">
      <h2>Kitchen</h2>
      {error && <p className="pos-bad">{error}</p>}
      <div className="pos-board">
        {columns.map(([status, title]) => (
          <section key={status}>
            <h3>{title} <span className="pos-badge">{inColumn(status).length}</span></h3>
            {inColumn(status).length === 0 && <p className="pos-empty">Nothing here.</p>}
            {inColumn(status).map((order) => {
              const next = nextStep(order);
              const mins = minutesSince(order.createdAt);
              return (
                <article key={order._id} className={"pos-ticket-card s-" + order.status}>
                  <header>
                    <strong>{order.code}</strong>
                    <span className={mins >= 20 ? "pos-bad" : "pos-meta"}>{mins} min</span>
                  </header>
                  <p className="pos-meta">{typeLabel[order.orderType]}{order.table && ` · Table ${order.table}`}{order.orderType === "delivery" && ` · ${order.customer.name}`}</p>
                  <ul>
                    {order.items.map((i) => (
                      <li key={i._id}><b>{i.qty}×</b> {i.name}{i.size !== "Regular" ? ` (${i.size})` : ""}</li>
                    ))}
                  </ul>
                  {order.customer.notes && <p className="pos-note-box">{order.customer.notes}</p>}
                  {next && <button className="pos-btn pos-btn-main" onClick={() => move(order, next[0])}>{next[1]}</button>}
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
