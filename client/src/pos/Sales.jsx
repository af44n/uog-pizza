import { useEffect, useState } from "react";
import { money } from "../store.jsx";
import { staffFetch } from "./api.js";

export default function Sales() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = () => staffFetch("/summary").then(setData).catch((err) => setError(err.message));
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  if (error) return <p className="pos-bad pos-page">{error}</p>;
  if (!data) return <p className="pos-empty pos-page">Loading…</p>;

  const top = data.topItems[0]?.qty || 1;

  return (
    <div className="pos-page">
      <h2>Today's sales</h2>

      <div className="pos-stats">
        <div><span>Revenue</span><b>{money(data.revenue)}</b></div>
        <div><span>Orders</span><b>{data.orders}</b></div>
        <div><span>Average order</span><b>{money(data.average)}</b></div>
      </div>

      <div className="pos-split">
        <div className="pos-box">
          <h3>By payment</h3>
          <div className="row"><span>Cash ({data.cash.orders})</span><b>{money(data.cash.revenue)}</b></div>
          <div className="row"><span>Card ({data.card.orders})</span><b>{money(data.card.revenue)}</b></div>
        </div>
        <div className="pos-box">
          <h3>By channel</h3>
          <div className="row"><span>Counter ({data.counter.orders})</span><b>{money(data.counter.revenue)}</b></div>
          <div className="row"><span>Website ({data.online.orders})</span><b>{money(data.online.revenue)}</b></div>
        </div>
      </div>

      <div className="pos-box">
        <h3>Best sellers</h3>
        {data.topItems.length === 0 && <p className="pos-empty">No sales yet today.</p>}
        {data.topItems.map((item) => (
          <div className="pos-hbar" key={item.name}>
            <span>{item.name}</span>
            <div><i style={{ width: (item.qty / top) * 100 + "%" }} /></div>
            <b>{item.qty}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
