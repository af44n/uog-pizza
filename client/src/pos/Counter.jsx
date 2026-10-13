import { useState } from "react";
import { useMenu, money } from "../store.jsx";
import { staffFetch, timeOf } from "./api.js";

const categories = ["Pizza", "Sides", "Drinks", "Dessert"];

export default function Counter() {
  const { products, sizes } = useMenu();
  const [category, setCategory] = useState("Pizza");
  const [lines, setLines] = useState([]);            // the ticket: { key, product, size, qty }
  const [orderType, setOrderType] = useState("dine-in");
  const [payment, setPayment] = useState("cash");
  const [cash, setCash] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);      // the finished order, shown in a pop-up

  const priceOf = (product, size) => (product.sized ? Math.round(product.price * (sizes[size] || 1)) : product.price);
  const total = lines.reduce((sum, l) => sum + priceOf(l.product, l.size) * l.qty, 0);
  const cashNumber = Number(cash) || 0;

  function add(product, size) {
    const key = product._id + "-" + size;
    setLines((current) => {
      const found = current.find((l) => l.key === key);
      if (found) return current.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...current, { key, product, size, qty: 1 }];
    });
  }

  const change = (key, amount) =>
    setLines((current) => current.map((l) => (l.key === key ? { ...l, qty: l.qty + amount } : l)).filter((l) => l.qty > 0));

  function reset() {
    setLines([]);
    setCash("");
    setName("");
    setError("");
  }

  async function charge() {
    setError("");
    if (lines.length === 0) return setError("Add at least one item.");
    if (payment === "cash" && cashNumber < total) return setError("Cash received is less than the total.");

    setBusy(true);
    try {
      const order = await staffFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.product._id, size: l.size, qty: l.qty })),
          payment,
          cashReceived: cashNumber,
          orderType,
          customerName: name
        })
      });
      setReceipt(order);
      reset();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  const visible = products.filter((p) => p.category === category);
  const quick = [...new Set([total, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000, 5000])]
    .filter((v) => total > 0 && v >= total)
    .sort((a, b) => a - b)
    .slice(0, 4);

  return (
    <div className="pos-counter">
      <section className="pos-menu">
        <div className="pos-tabs">
          {categories.map((c) => (
            <button key={c} className={category === c ? "on" : ""} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>

        <div className="pos-items">
          {visible.map((p) => (
            <div key={p._id} className={"pos-item" + (p.available ? "" : " off")}>
              <strong>{p.name}</strong>
              {p.available ? (
                p.sized ? (
                  <div className="pos-sizes">
                    {["Small", "Medium", "Large"].map((s) => (
                      <button key={s} onClick={() => add(p, s)}>
                        {s[0]}<small>{money(priceOf(p, s))}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button className="pos-add" onClick={() => add(p, "Regular")}>{money(p.price)}</button>
                )
              ) : (
                <span className="pos-soldout">Sold out</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <aside className="pos-ticket">
        <h2>Ticket</h2>

        <div className="pos-toggle">
          {[["dine-in", "Dine in"], ["takeaway", "Takeaway"]].map(([v, label]) => (
            <button key={v} className={orderType === v ? "on" : ""} onClick={() => setOrderType(v)}>{label}</button>
          ))}
        </div>

        <ul className="pos-lines">
          {lines.length === 0 && <li className="pos-empty">Tap an item to add it.</li>}
          {lines.map((l) => (
            <li key={l.key}>
              <span className="pos-line-name">
                {l.product.name}
                {l.product.sized && <small> · {l.size}</small>}
              </span>
              <span className="pos-qty">
                <button onClick={() => change(l.key, -1)} aria-label="One less">−</button>
                <b>{l.qty}</b>
                <button onClick={() => change(l.key, 1)} aria-label="One more">+</button>
              </span>
              <span className="pos-line-price">{money(priceOf(l.product, l.size) * l.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="pos-total"><span>Total</span><span>{money(total)}</span></div>

        <input id="pos-name" className="pos-input" placeholder="Customer name (optional)" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="pos-toggle">
          {[["cash", "Cash"], ["card", "Card"]].map(([v, label]) => (
            <button key={v} className={payment === v ? "on" : ""} onClick={() => setPayment(v)}>{label}</button>
          ))}
        </div>

        {payment === "cash" && (
          <div className="pos-cash">
            <input id="pos-cash" className="pos-input" type="number" min="0" placeholder="Cash received" value={cash} onChange={(e) => setCash(e.target.value)} />
            <div className="pos-quick">
              {quick.map((v) => (
                <button key={v} onClick={() => setCash(String(v))}>{v === total ? "Exact" : money(v)}</button>
              ))}
            </div>
            {cash !== "" && (
              <p className={cashNumber < total ? "pos-bad" : "pos-ok"}>
                {cashNumber < total ? `Short by ${money(total - cashNumber)}` : `Change: ${money(cashNumber - total)}`}
              </p>
            )}
          </div>
        )}

        {error && <p className="pos-bad" role="alert">{error}</p>}

        <div className="pos-actions">
          <button className="pos-btn pos-btn-ghost" onClick={reset}>Clear</button>
          <button className="pos-btn pos-btn-main" onClick={charge} disabled={busy}>
            {busy ? "Saving…" : `Charge ${money(total)}`}
          </button>
        </div>
      </aside>

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

// The receipt pop-up. "Print" uses the browser's print dialog (the CSS hides everything else).
function Receipt({ order, onClose }) {
  return (
    <div className="pos-overlay" onClick={onClose}>
      <div className="pos-receipt" id="print-area" onClick={(e) => e.stopPropagation()}>
        <h3>UOG PIZZA</h3>
        <p className="center">Order {order.code} · {order.orderType === "dine-in" ? "Dine in" : "Takeaway"}<br />{new Date(order.createdAt).toLocaleDateString()} {timeOf(order.createdAt)}</p>
        <hr />
        {order.items.map((i) => (
          <div className="row" key={i._id}>
            <span>{i.qty} × {i.name}{i.size !== "Regular" ? ` (${i.size})` : ""}</span>
            <span>{money(i.unitPrice * i.qty)}</span>
          </div>
        ))}
        <hr />
        <div className="row bold"><span>TOTAL</span><span>{money(order.total)}</span></div>
        <div className="row"><span>Paid by</span><span>{order.payment === "card" ? "Card" : "Cash"}</span></div>
        {order.payment === "cash" && (
          <>
            <div className="row"><span>Cash</span><span>{money(order.cashReceived)}</span></div>
            <div className="row"><span>Change</span><span>{money(order.cashReceived - order.total)}</span></div>
          </>
        )}
        <p className="center">Thank you!</p>
        <div className="pos-actions no-print">
          <button className="pos-btn pos-btn-ghost" onClick={() => window.print()}>Print</button>
          <button className="pos-btn pos-btn-main" onClick={onClose}>New order</button>
        </div>
      </div>
    </div>
  );
}
