import { useEffect, useState } from "react";
import { money } from "../store.jsx";
import { staffFetch, downloadReport } from "./api.js";

const dayName = (iso) => new Date(iso + "T12:00:00").toLocaleDateString([], { weekday: "short" });
const hourName = (h) => (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? "a" : "p");

// A simple column chart: label under each bar, value in the tooltip
function Columns({ data, label, value, format = money }) {
  const max = Math.max(1, ...data.map(value));
  return (
    <div className="pos-columns" role="img" aria-label="Bar chart">
      {data.map((d, i) => (
        <div key={i} title={`${label(d)}: ${format(value(d))}`}>
          <i style={{ height: (value(d) / max) * 100 + "%" }} />
          <span>{label(d)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Sales() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [days, setDays] = useState(1);

  useEffect(() => {
    const load = () => staffFetch("/summary").then(setData).catch((err) => setError(err.message));
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  if (error) return <p className="pos-bad pos-page">{error}</p>;
  if (!data) return <p className="pos-empty pos-page">Loading…</p>;

  const top = data.topItems[0]?.qty || 1;
  // Show only the opening hours that actually had sales, plus a little context
  const busy = data.hours.map((h, i) => (h.orders ? i : -1)).filter((i) => i >= 0);
  const hours = busy.length ? data.hours.slice(Math.max(0, busy[0] - 1), busy[busy.length - 1] + 2) : [];

  return (
    <div className="pos-page">
      <div className="pos-page-head">
        <h2>Today's sales</h2>
        <div className="pos-filters">
          <select className="pos-input" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Export range">
            <option value={1}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button className="pos-btn pos-btn-ghost" onClick={() => downloadReport(days).catch((e) => setError(e.message))}>Export CSV</button>
        </div>
      </div>

      <div className="pos-stats">
        <div><span>Revenue</span><b>{money(data.revenue)}</b></div>
        <div><span>Orders</span><b>{data.orders}</b></div>
        <div><span>Average order</span><b>{money(data.average)}</b></div>
        <div><span>Cash in the till</span><b>{money(data.cashInDrawer)}</b></div>
        <div><span>Discounts given</span><b>{money(data.discounts)}</b></div>
        <div><span>Cancelled</span><b>{data.cancelled.orders}</b></div>
      </div>

      <div className="pos-split">
        <div className="pos-box">
          <h3>Orders by hour</h3>
          {hours.length === 0 ? <p className="pos-empty">No sales yet today.</p> : <Columns data={hours} label={(h) => hourName(h.hour)} value={(h) => h.orders} format={(n) => n + " orders"} />}
        </div>
        <div className="pos-box">
          <h3>Last 7 days</h3>
          <Columns data={data.week} label={(d) => dayName(d.date)} value={(d) => d.revenue} />
        </div>
      </div>

      <div className="pos-split">
        <div className="pos-box">
          <h3>By payment</h3>
          <div className="row"><span>Cash ({data.cash.orders})</span><b>{money(data.cash.revenue)}</b></div>
          <div className="row"><span>Cash on delivery ({data.cod.orders})</span><b>{money(data.cod.revenue)}</b></div>
          <div className="row"><span>Card ({data.card.orders})</span><b>{money(data.card.revenue)}</b></div>
        </div>
        <div className="pos-box">
          <h3>By channel</h3>
          <div className="row"><span>Counter ({data.counter.orders})</span><b>{money(data.counter.revenue)}</b></div>
          <div className="row"><span>Website ({data.online.orders})</span><b>{money(data.online.revenue)}</b></div>
        </div>
        <div className="pos-box">
          <h3>By order type</h3>
          <div className="row"><span>Dine in ({data.types["dine-in"].orders})</span><b>{money(data.types["dine-in"].revenue)}</b></div>
          <div className="row"><span>Takeaway ({data.types.takeaway.orders})</span><b>{money(data.types.takeaway.revenue)}</b></div>
          <div className="row"><span>Delivery ({data.types.delivery.orders})</span><b>{money(data.types.delivery.revenue)}</b></div>
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
