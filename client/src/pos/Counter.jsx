import { useEffect, useState } from "react";
import { useMenu, money } from "../store.jsx";
import { staffFetch } from "./api.js";
import Receipt from "./Receipt.jsx";

const categories = ["Pizza", "Sides", "Drinks", "Dessert"];
const types = [["dine-in", "Dine in"], ["takeaway", "Takeaway"], ["delivery", "Delivery"]];

// Tickets that staff "hold" while a customer decides are kept in the browser
const loadHeld = () => {
  try {
    return JSON.parse(localStorage.getItem("uog-held")) || [];
  } catch {
    return [];
  }
};

export default function Counter() {
  const { products, sizes, freeDeliveryOver, deliveryFee } = useMenu();
  const [category, setCategory] = useState("Pizza");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState([]);            // the ticket: { key, product, size, qty }
  const [orderType, setOrderType] = useState("dine-in");
  const [payment, setPayment] = useState("cash");
  const [cash, setCash] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [table, setTable] = useState("");
  const [notes, setNotes] = useState("");
  const [discType, setDiscType] = useState("percent");
  const [discValue, setDiscValue] = useState("");
  const [held, setHeld] = useState(loadHeld);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);      // the finished order, shown in a pop-up

  useEffect(() => {
    try {
      localStorage.setItem("uog-held", JSON.stringify(held));
    } catch {}
  }, [held]);

  const isDelivery = orderType === "delivery";
  const priceOf = (product, size) => (product.sized ? Math.round(product.price * (sizes[size] || 1)) : product.price);
  const subtotal = lines.reduce((sum, l) => sum + priceOf(l.product, l.size) * l.qty, 0);

  // Same rules as the server: a percentage up to 100, or a fixed amount, never more than the subtotal
  const discNumber = Number(discValue) || 0;
  const discount = Math.min(subtotal, discType === "percent" ? Math.round((subtotal * Math.min(discNumber, 100)) / 100) : Math.round(discNumber));
  const fee = isDelivery && subtotal > 0 && subtotal < freeDeliveryOver ? deliveryFee : 0;
  const total = subtotal - discount + fee;
  const cashNumber = Number(cash) || 0;
  const payMethods = isDelivery ? [["cod", "Cash on delivery"], ["card", "Card"]] : [["cash", "Cash"], ["card", "Card"]];

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
    setPhone("");
    setAddress("");
    setTable("");
    setNotes("");
    setDiscValue("");
    setError("");
  }

  function changeType(type) {
    setOrderType(type);
    setPayment(type === "delivery" ? "cod" : "cash");
  }

  // Put the current ticket aside, or bring one back
  function hold() {
    if (lines.length === 0) return setError("Nothing to hold yet.");
    setHeld((h) => [...h, { id: Date.now(), at: new Date().toISOString(), label: name || (table ? "Table " + table : "Ticket"), lines, orderType, name, phone, address, table, notes, discType, discValue }]);
    reset();
  }

  function recall(ticket) {
    if (lines.length > 0 && !confirm("Replace the current ticket with this held one?")) return;
    // Use the live menu entry in case the price or availability changed while it was held
    const fresh = ticket.lines
      .map((l) => ({ ...l, product: products.find((p) => p._id === l.product._id) }))
      .filter((l) => l.product && l.product.available);
    setLines(fresh);
    setOrderType(ticket.orderType);
    setPayment(ticket.orderType === "delivery" ? "cod" : "cash");
    setName(ticket.name);
    setPhone(ticket.phone);
    setAddress(ticket.address);
    setTable(ticket.table);
    setNotes(ticket.notes);
    setDiscType(ticket.discType);
    setDiscValue(ticket.discValue);
    setHeld((h) => h.filter((t) => t.id !== ticket.id));
  }

  async function charge() {
    setError("");
    if (lines.length === 0) return setError("Add at least one item.");
    if (isDelivery && (!phone.trim() || !address.trim())) return setError("A delivery order needs a phone number and an address.");
    if (payment === "cash" && cashNumber < total) return setError("Cash received is less than the total.");

    setBusy(true);
    try {
      const order = await staffFetch("/orders", {
        method: "POST",
        data: {
          items: lines.map((l) => ({ productId: l.product._id, size: l.size, qty: l.qty })),
          payment,
          cashReceived: cashNumber,
          orderType,
          customerName: name,
          phone,
          address,
          table,
          notes,
          discount: discNumber > 0 ? { type: discType, value: discNumber } : undefined
        }
      });
      setReceipt(order);
      reset();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  // While searching, look across every category
  const query = search.trim().toLowerCase();
  const visible = query ? products.filter((p) => p.name.toLowerCase().includes(query)) : products.filter((p) => p.category === category);
  const quick = [...new Set([total, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000, 5000])]
    .filter((v) => total > 0 && v >= total)
    .sort((a, b) => a - b)
    .slice(0, 4);

  return (
    <div className="pos-counter">
      <section className="pos-menu">
        <div className="pos-tabs">
          {categories.map((c) => (
            <button key={c} className={!query && category === c ? "on" : ""} onClick={() => { setSearch(""); setCategory(c); }}>{c}</button>
          ))}
          <input className="pos-input pos-search" type="search" placeholder="Search the menu…" aria-label="Search the menu" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {held.length > 0 && (
          <div className="pos-held">
            <span>On hold:</span>
            {held.map((t) => (
              <span key={t.id} className="pos-held-ticket">
                <button onClick={() => recall(t)}>{t.label} · {t.lines.reduce((n, l) => n + l.qty, 0)} items</button>
                <button aria-label="Discard held ticket" onClick={() => setHeld((h) => h.filter((x) => x.id !== t.id))}>×</button>
              </span>
            ))}
          </div>
        )}

        <div className="pos-items">
          {visible.length === 0 && <p className="pos-empty">Nothing matches “{search}”.</p>}
          {visible.map((p) => (
            <div key={p._id} className={"pos-item" + (p.available ? "" : " off")}>
              <strong>{p.name}</strong>
              {p.available && p.stock != null && <small className={p.stock <= 5 ? "pos-bad" : "pos-note"}>{p.stock} left</small>}
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
          {types.map(([v, label]) => (
            <button key={v} className={orderType === v ? "on" : ""} onClick={() => changeType(v)}>{label}</button>
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

        <div className="pos-fields">
          {orderType === "dine-in" && <input className="pos-input" placeholder="Table no." aria-label="Table number" value={table} onChange={(e) => setTable(e.target.value)} maxLength={10} />}
          <input className="pos-input" placeholder={isDelivery ? "Customer name" : "Customer name (optional)"} aria-label="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
          {isDelivery && (
            <>
              <input className="pos-input" type="tel" placeholder="Phone number" aria-label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className="pos-input" placeholder="Delivery address" aria-label="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </>
          )}
          <input className="pos-input" placeholder="Kitchen note (e.g. no onions)" aria-label="Kitchen note" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="pos-discount">
          <span>Discount</span>
          <div className="pos-toggle">
            <button className={discType === "percent" ? "on" : ""} onClick={() => setDiscType("percent")}>%</button>
            <button className={discType === "amount" ? "on" : ""} onClick={() => setDiscType("amount")}>Rs</button>
          </div>
          <input className="pos-input" type="number" min="0" placeholder="0" aria-label="Discount" value={discValue} onChange={(e) => setDiscValue(e.target.value)} />
        </div>

        <div className="pos-sums">
          {(discount > 0 || fee > 0) && <div><span>Subtotal</span><span>{money(subtotal)}</span></div>}
          {discount > 0 && <div><span>Discount</span><span>− {money(discount)}</span></div>}
          {fee > 0 && <div><span>Delivery fee</span><span>{money(fee)}</span></div>}
        </div>
        <div className="pos-total"><span>Total</span><span>{money(total)}</span></div>

        <div className="pos-toggle">
          {payMethods.map(([v, label]) => (
            <button key={v} className={payment === v ? "on" : ""} onClick={() => setPayment(v)}>{label}</button>
          ))}
        </div>

        {payment === "cash" && (
          <div className="pos-cash">
            <input className="pos-input" type="number" min="0" placeholder="Cash received" aria-label="Cash received" value={cash} onChange={(e) => setCash(e.target.value)} />
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

        <div className="pos-actions3">
          <button className="pos-btn pos-btn-ghost" onClick={reset}>Clear</button>
          <button className="pos-btn pos-btn-ghost" onClick={hold}>Hold</button>
          <button className="pos-btn pos-btn-main" onClick={charge} disabled={busy}>
            {busy ? "Saving…" : `Charge ${money(total)}`}
          </button>
        </div>
      </aside>

      {receipt && <Receipt order={receipt} onClose={() => setReceipt(null)} closeLabel="New order" />}
    </div>
  );
}
