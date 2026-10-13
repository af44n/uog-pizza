import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useCart, money } from "../store.jsx";
import Art from "./Art.jsx";

export default function CartDrawer() {
  const { open, setOpen, items, subtotal, delivery, total, change, freeDeliveryOver } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  // progress towards free delivery
  const progress = Math.min(100, (subtotal / freeDeliveryOver) * 100);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-label="Your cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="drawer-head">
              <h2>Your order</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close cart">
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <div className="drawer-empty">
                <div className="drawer-empty-art">
                  <Art kind="margherita" seed={9} />
                </div>
                <p>Nothing here yet. The oven is hot, though.</p>
                <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Browse the menu
                </button>
              </div>
            ) : (
              <>
                <div className="free-bar">
                  <p>
                    {subtotal >= freeDeliveryOver
                      ? "You've unlocked free delivery."
                      : `Add ${money(freeDeliveryOver - subtotal)} more for free delivery`}
                  </p>
                  <div className="free-track">
                    <motion.div className="free-fill" animate={{ width: progress + "%" }} transition={{ duration: 0.8 }} />
                  </div>
                </div>

                <ul className="drawer-list">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="line">
                          <div className="line-art">
                            <Art kind={item.product.art} seed={4} />
                          </div>
                          <div className="line-info">
                            <strong>{item.product.name}</strong>
                            <span>{item.product.sized ? item.size : "Regular"}</span>
                            <div className="qty">
                              <button onClick={() => change(item.key, -1)} aria-label="One less">−</button>
                              <b>{item.qty}</b>
                              <button onClick={() => change(item.key, 1)} aria-label="One more">+</button>
                            </div>
                          </div>
                          <span className="line-price">{money(item.unitPrice * item.qty)}</span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="drawer-foot">
                  <div className="sum-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  <div className="sum-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : money(delivery)}</span></div>
                  <div className="sum-row sum-total"><span>Total</span><span>{money(total)}</span></div>
                  <button className="btn btn-primary btn-wide" onClick={goCheckout}>
                    Checkout
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
