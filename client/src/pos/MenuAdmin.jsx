import { useState } from "react";
import { useMenu, money } from "../store.jsx";
import { staffFetch } from "./api.js";

const categories = ["Pizza", "Sides", "Drinks", "Dessert"];

// Staff can mark items sold out, change prices, track stock, and add or remove items
export default function MenuAdmin() {
  const { products, reload } = useMenu();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);   // the item being edited
  const [adding, setAdding] = useState(false);

  const run = (promise) => promise.then(reload).catch((err) => setError(err.message));
  const toggle = (p) => run(staffFetch("/products/" + p._id, { method: "PATCH", data: { available: !p.available } }));
  const remove = (p) => confirm(`Delete ${p.name} from the menu?`) && run(staffFetch("/products/" + p._id, { method: "DELETE" }));

  return (
    <div className="pos-page">
      <div className="pos-page-head">
        <h2>Menu</h2>
        <button className="pos-btn pos-btn-main" onClick={() => setAdding(true)}>+ Add item</button>
      </div>
      {error && <p className="pos-bad">{error}</p>}

      {categories.map((cat) => (
        <section key={cat}>
          <h3>{cat}</h3>
          <ul className="pos-menu-list">
            {products.filter((p) => p.category === cat).map((p) => (
              <li key={p._id}>
                <span>
                  <strong>{p.name}</strong>
                  <small> {money(p.price)}{p.sized && " (Medium)"} · {p.stock == null ? "stock not tracked" : p.stock + " in stock"}</small>
                </span>
                <span className="pos-order-buttons">
                  <button className="pos-btn pos-btn-ghost" onClick={() => setEditing(p)}>Edit</button>
                  <button className="pos-btn pos-btn-ghost" onClick={() => remove(p)}>Delete</button>
                  <button className={"pos-switch" + (p.available ? " on" : "")} onClick={() => toggle(p)} aria-pressed={p.available}>
                    {p.available ? "Available" : "Sold out"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {(editing || adding) && (
        <ItemForm
          item={editing}
          onClose={() => { setEditing(null); setAdding(false); }}
          onSave={(data) => {
            const request = editing
              ? staffFetch("/products/" + editing._id, { method: "PATCH", data })
              : staffFetch("/products", { method: "POST", data });
            return request.then(() => { reload(); setEditing(null); setAdding(false); });
          }}
        />
      )}
    </div>
  );
}

function ItemForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "Pizza",
    price: item?.price ?? "",
    stock: item?.stock ?? "",
    description: item?.description || ""
  });
  const [error, setError] = useState("");
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const { category, ...rest } = form;
    onSave(item ? rest : form).catch((err) => setError(err.message));
  };

  return (
    <div className="pos-overlay" onClick={onClose}>
      <form className="pos-dialog" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{item ? "Edit " + item.name : "New menu item"}</h3>
        <input className="pos-input" placeholder="Name" aria-label="Name" value={form.name} onChange={set("name")} autoFocus />
        {!item && (
          <select className="pos-input" aria-label="Category" value={form.category} onChange={set("category")}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <input className="pos-input" type="number" min="1" placeholder={(form.category === "Pizza" ? "Medium price" : "Price") + " (Rs)"} aria-label="Price" value={form.price} onChange={set("price")} />
        <input className="pos-input" type="number" min="0" placeholder="Stock today (leave empty to not track)" aria-label="Stock" value={form.stock} onChange={set("stock")} />
        <input className="pos-input" placeholder="Description (shown on the website)" aria-label="Description" value={form.description} onChange={set("description")} />
        {error && <p className="pos-bad" role="alert">{error}</p>}
        <div className="pos-actions">
          <button type="button" className="pos-btn pos-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="pos-btn pos-btn-main">Save</button>
        </div>
      </form>
    </div>
  );
}
