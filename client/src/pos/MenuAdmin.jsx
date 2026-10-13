import { useState } from "react";
import { useMenu, money } from "../store.jsx";
import { staffFetch } from "./api.js";

// Lets staff switch an item off when it has sold out (customers can't order it, the counter greys it out)
export default function MenuAdmin() {
  const { products, reload } = useMenu();
  const [error, setError] = useState("");

  const toggle = (product) =>
    staffFetch("/products/" + product._id, { method: "PATCH", body: JSON.stringify({ available: !product.available }) })
      .then(reload)
      .catch((err) => setError(err.message));

  return (
    <div className="pos-page">
      <h2>Menu availability</h2>
      {error && <p className="pos-bad">{error}</p>}
      <ul className="pos-menu-list">
        {products.map((p) => (
          <li key={p._id}>
            <span><strong>{p.name}</strong><small> {p.category} · {money(p.price)}</small></span>
            <button className={"pos-switch" + (p.available ? " on" : "")} onClick={() => toggle(p)} aria-pressed={p.available}>
              {p.available ? "Available" : "Sold out"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
