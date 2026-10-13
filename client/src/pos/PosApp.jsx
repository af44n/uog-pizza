import { useState } from "react";
import { Link } from "react-router-dom";
import { getPin, savePin, clearPin } from "./api.js";
import Counter from "./Counter.jsx";
import Orders from "./Orders.jsx";
import Sales from "./Sales.jsx";
import MenuAdmin from "./MenuAdmin.jsx";
import "./pos.css";

const tabs = [["counter", "Counter"], ["orders", "Orders"], ["sales", "Sales"], ["menu", "Menu"]];

// The staff PIN screen
function Login({ onDone }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    if (res.ok) {
      savePin(pin);
      onDone();
    } else {
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

export default function PosApp() {
  const [signedIn, setSignedIn] = useState(!!getPin());
  const [tab, setTab] = useState("counter");

  if (!signedIn) return <Login onDone={() => setSignedIn(true)} />;

  return (
    <div className="pos">
      <header className="pos-bar">
        <strong className="pos-brand">UOG Pizza <small>POS</small></strong>
        <nav>
          {tabs.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <button className="pos-btn pos-btn-ghost" onClick={() => { clearPin(); setSignedIn(false); }}>Sign out</button>
      </header>
      <main>
        {tab === "counter" && <Counter />}
        {tab === "orders" && <Orders />}
        {tab === "sales" && <Sales />}
        {tab === "menu" && <MenuAdmin />}
      </main>
    </div>
  );
}
