import { money } from "../store.jsx";
import { timeOf, typeLabel, payLabel } from "./api.js";

// The receipt pop-up. "Print" uses the browser's print dialog (the CSS hides everything else).
export default function Receipt({ order, onClose, closeLabel = "Close" }) {
  const discount = order.discount?.amount || 0;
  return (
    <div className="pos-overlay" onClick={onClose}>
      <div className="pos-receipt" id="print-area" onClick={(e) => e.stopPropagation()}>
        <h3>UOG PIZZA</h3>
        <p className="center">
          Order {order.code} · {typeLabel[order.orderType]}{order.table && ` · Table ${order.table}`}
          <br />
          {new Date(order.createdAt).toLocaleDateString()} {timeOf(order.createdAt)}
        </p>
        {order.customer.name !== "Walk-in" && <p className="center">{order.customer.name}</p>}
        <hr />
        {order.items.map((i) => (
          <div className="row" key={i._id}>
            <span>{i.qty} × {i.name}{i.size !== "Regular" ? ` (${i.size})` : ""}</span>
            <span>{money(i.unitPrice * i.qty)}</span>
          </div>
        ))}
        {order.customer.notes && <p>Note: {order.customer.notes}</p>}
        <hr />
        {(discount > 0 || order.deliveryFee > 0) && <div className="row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>}
        {discount > 0 && (
          <div className="row"><span>Discount{order.discount.type === "percent" ? ` (${order.discount.value}%)` : ""}</span><span>− {money(discount)}</span></div>
        )}
        {order.deliveryFee > 0 && <div className="row"><span>Delivery</span><span>{money(order.deliveryFee)}</span></div>}
        <div className="row bold"><span>TOTAL</span><span>{money(order.total)}</span></div>
        <div className="row"><span>Paid by</span><span>{payLabel[order.payment]}</span></div>
        {order.payment === "cash" && order.cashReceived != null && (
          <>
            <div className="row"><span>Cash</span><span>{money(order.cashReceived)}</span></div>
            <div className="row"><span>Change</span><span>{money(order.cashReceived - order.total)}</span></div>
          </>
        )}
        {order.orderType === "delivery" && <p className="center">{order.customer.phone}<br />{order.customer.address}</p>}
        <p className="center">Thank you!</p>
        <div className="pos-actions no-print">
          <button className="pos-btn pos-btn-ghost" onClick={() => window.print()}>Print</button>
          <button className="pos-btn pos-btn-main" onClick={onClose}>{closeLabel}</button>
        </div>
      </div>
    </div>
  );
}
