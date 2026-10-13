import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { useCart } from "../store.jsx";

// Scroll smoothly to a section on the home page
function jump(id) {
  const target = document.getElementById(id);
  if (target && window.__lenis) window.__lenis.scrollTo(target, { offset: -70, duration: 1.8 });
}

export default function Nav() {
  const { count, setOpen } = useCart();
  const onHome = useLocation().pathname === "/";

  return (
    <motion.header
      className="nav"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 2.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="brand" aria-label="UOG Pizza home">
        <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="#d9822b" />
          <circle cx="32" cy="32" r="24" fill="#c8321e" />
          <circle cx="32" cy="32" r="20" fill="#f1c24f" />
          <circle cx="25" cy="27" r="4.5" fill="#a3200f" />
          <circle cx="39" cy="31" r="4.5" fill="#a3200f" />
          <circle cx="29" cy="40" r="4.5" fill="#a3200f" />
        </svg>
        <span>UOG Pizza</span>
      </Link>

      {onHome && (
        <nav className="nav-links" aria-label="Sections">
          <button onClick={() => jump("menu")}>Menu</button>
          <button onClick={() => jump("story")}>Our oven</button>
          <button onClick={() => jump("visit")}>Visit</button>
        </nav>
      )}

      <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`}>
        Cart
        <motion.span key={count} className="cart-count" initial={{ scale: 1.7 }} animate={{ scale: 1 }}>
          {count}
        </motion.span>
      </button>
    </motion.header>
  );
}
