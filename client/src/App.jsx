import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Lenis from "lenis";
import Nav from "./components/Nav.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Home from "./pages/Home.jsx";
import Checkout from "./pages/Checkout.jsx";
import Order from "./pages/Order.jsx";
import PosApp from "./pos/PosApp.jsx";

// The opening animation: the name rises, then the curtain lifts
function Intro({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2300);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div className="intro" exit={{ y: "-100%" }} transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}>
      <div className="intro-word">
        {"UOG PIZZA".split("").map((letter, i) => (
          <span key={i} className="intro-mask">
            <motion.span
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {letter === " " ? " " : letter}
            </motion.span>
          </span>
        ))}
      </div>
      <motion.div
        className="intro-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 1.7, ease: "easeInOut" }}
      />
      <p className="intro-sub">Stone-baked on campus</p>
    </motion.div>
  );
}

export default function App() {
  // ?nointro in the address skips the opening animation (handy while developing)
  const location = useLocation();
  const isPos = location.pathname.startsWith("/pos"); // the staff till has no intro, nav or smooth scrolling
  const [showIntro, setShowIntro] = useState(!isPos && !window.location.search.includes("nointro"));

  // Smooth, slow scrolling for the whole site
  useEffect(() => {
    if (isPos) return;
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
    window.__lenis = lenis;
    let frame;
    const loop = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      window.__lenis = null;
    };
  }, [isPos]);

  // Start at the top whenever the page changes
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  // Lock scrolling while the intro plays
  useEffect(() => {
    document.documentElement.classList.toggle("locked", showIntro);
  }, [showIntro]);

  return (
    <>
      <AnimatePresence>{showIntro && <Intro onDone={() => setShowIntro(false)} />}</AnimatePresence>
      {!isPos && <Nav />}
      {!isPos && <CartDrawer />}
      <Routes>
        <Route path="/pos" element={<PosApp />} />
        <Route path="/" element={<Home ready={!showIntro} />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:code" element={<Order />} />
      </Routes>
    </>
  );
}
