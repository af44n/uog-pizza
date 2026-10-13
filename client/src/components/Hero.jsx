import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Pizza, FloatBasil, FloatChilli, FloatTomato } from "./Art.jsx";

const ease = [0.22, 1, 0.36, 1];

// One line of the headline that slides up out of a mask
function Line({ children, delay, ready }) {
  return (
    <span className="mask">
      <motion.span
        className="mask-inner"
        initial={{ y: "115%" }}
        animate={ready ? { y: 0 } : {}}
        transition={{ duration: 1.3, delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function jump(id) {
  const target = document.getElementById(id);
  if (target && window.__lenis) window.__lenis.scrollTo(target, { offset: -70, duration: 1.8 });
}

export default function Hero({ ready }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // As you scroll down, the pizza turns slowly and the extras drift at different speeds
  const spin = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const pizzaY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const basilY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const chilliY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const tomatoY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section className="hero" ref={ref}>
      <div className="hero-glow" aria-hidden="true" />

      <motion.div className="hero-copy" style={{ y: textY }}>
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          Stone oven · University of Gujarat
        </motion.p>

        <h1 className="hero-title">
          <Line delay={0.2} ready={ready}>Slow dough.</Line>
          <Line delay={0.4} ready={ready}><em>Fast delivery.</em></Line>
        </h1>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, delay: 0.9, ease }}
        >
          Our dough rests for 48 hours, bakes at 450°C in under five minutes, and reaches
          your hostel while it's still blistering.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 24 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, delay: 1.1, ease }}
        >
          <button className="btn btn-primary" onClick={() => jump("menu")}>Order now</button>
          <button className="btn btn-ghost" onClick={() => jump("story")}>See the oven</button>
        </motion.div>
      </motion.div>

      <div className="hero-art">
        {/* rotating text badge */}
        <motion.svg
          className="badge"
          viewBox="0 0 200 200"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          aria-hidden="true"
        >
          <defs>
            <path id="badgePath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#badgePath" textLength="486" lengthAdjust="spacing">HAND-STRETCHED · WOOD-FIRED · 450°C · 48 HR DOUGH ·</textPath>
          </text>
        </motion.svg>

        <motion.div
          className="hero-pizza"
          style={{ y: pizzaY, rotate: spin }}
          initial={{ opacity: 0, scale: 0.6, rotate: -60 }}
          animate={ready ? { opacity: 1, scale: 1, rotate: 0 } : {}}
          transition={{ duration: 2, delay: 0.3, ease }}
        >
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 90, ease: "linear" }}>
            <Pizza kind="pepperoni" seed={5} />
          </motion.div>
        </motion.div>

        <motion.div className="float f-basil" style={{ y: basilY }}>
          <motion.div animate={{ y: [0, -14, 0], rotate: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}>
            <FloatBasil />
          </motion.div>
        </motion.div>
        <motion.div className="float f-chilli" style={{ y: chilliY }}>
          <motion.div animate={{ y: [0, 12, 0], rotate: [-10, 6, -10] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}>
            <FloatChilli />
          </motion.div>
        </motion.div>
        <motion.div className="float f-tomato" style={{ y: tomatoY }}>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
            <FloatTomato />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="scroll-cue"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 2, duration: 1 }}
        aria-hidden="true"
      >
        <span>Scroll</span>
        <motion.i animate={{ scaleY: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }} />
      </motion.div>
    </section>
  );
}
