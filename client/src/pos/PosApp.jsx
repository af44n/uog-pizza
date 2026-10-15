import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPin, savePin, clearPin, login, staffFetch } from "./api.js";
import Counter from "./Counter.jsx";
import Kitchen from "./Kitchen.jsx";
import Orders from "./Orders.jsx";
import Sales from "./Sales.jsx";
import MenuAdmin from "./MenuAdmin.jsx";
import "./pos.css";

const tabs = [["counter", "Counter"], ["orders", "Orders"], ["kitchen", "Kitchen"], ["sales", "Sales"], ["menu", "Menu"]];

// The staff PIN screen
function Login({ onDone }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await login(pin);
      savePin(pin);
      onDone();
    } catch {
      setError("Wrong PIN. Try again.");
      setPin("");
    }
  }

  return (
    <div className="pos-login">
      <form onSubmit={submit}>
        <h1>Staff sign in</h1>
        <p>Enter the PIN to open the till.</p>
        <input id="pin" type="password" inputMode="numeric" autoComplete="off" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
        {error && <p className="pos-bad" role="alert">{error}</p>}
        <button className="pos-btn pos-btn-main">Open till</button>
        <Link to="/">← Back to the website</Link>
      </form>
    </div>
  );
}

// A short beep so staff notice a new order even when they are looking at another screen
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export default function PosApp() {
  const [signedIn, setSignedIn] = useState(!!getPin());
  const [tab, setTab] = useState("counter");
  const [newOrders, setNewOrders] = useState(0);   // orders still waiting to be started
  const seen = useRef(null);

  // Check for new orders every 5 seconds, and beep when one arrives
  useEffect(() => {
    if (!signedIn) return;
    const check = () =>
      staffFetch("/orders", { params: { scope: "active" } })
        .then((orders) => {
          const waiting = orders.filter((o) => o.status === "received");
          if (seen.current !== null && waiting.some((o) => !seen.current.has(o._id))) beep();
          seen.current = new Set(waiting.map((o) => o._id));
          setNewOrders(waiting.length);
        })
        .catch(() => {});
    check();
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, [signedIn]);

  if (!signedIn) return <Login onDone={() => setSignedIn(true)} />;

  return (
    <div className="pos">
      <header className="pos-bar">
        <strong className="pos-brand">UOG Pizza <small>POS</small></strong>
        <nav>
          {tabs.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
              {(id === "orders" || id === "kitchen") && newOrders > 0 && <span className="pos-count">{newOrders}</span>}
            </button>
          ))}
        </nav>
        <button className="pos-btn pos-btn-ghost" onClick={() => { clearPin(); setSignedIn(false); }}>Sign out</button>
      </header>
      <main>
        {tab === "counter" && <Counter />}
        {tab === "orders" && <Orders />}
        {tab === "kitchen" && <Kitchen />}
        {tab === "sales" && <Sales />}
        {tab === "menu" && <MenuAdmin />}
      </main>
    </div>
  );
}
