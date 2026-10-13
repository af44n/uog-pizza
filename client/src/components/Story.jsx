import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const paragraph =
  "We start the dough two days before you get hungry. It rests, it rises, it is stretched by hand, and it meets a four hundred and fifty degree oven for less than five minutes. That is the whole secret. Everything else is tomatoes, cheese and patience.";

// Each word fades in as you scroll past it
function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

function Oven() {
  return (
    <svg viewBox="0 0 400 340" className="oven" role="img" aria-label="A wood-fired brick oven">
      <defs>
        <clipPath id="domeClip">
          <path d="M40,310 L40,200 C40,80 110,26 200,26 C290,26 360,80 360,200 L360,310 Z" />
        </clipPath>
        <radialGradient id="ovenGlow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#ffd16b" />
          <stop offset="55%" stopColor="#f2711f" />
          <stop offset="100%" stopColor="#7a1d0b" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="316" rx="170" ry="14" fill="#000" opacity=".28" />
      {/* the dome, drawn as rows of bricks */}
      <path d="M40,310 L40,200 C40,80 110,26 200,26 C290,26 360,80 360,200 L360,310 Z" fill="#8c3a22" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
        <g key={row} stroke="#5d2314" strokeWidth="3" fill="none" opacity=".85" clipPath="url(#domeClip)">
          <path d={`M${40 + row * 2},${310 - row * 42} L${360 - row * 2},${310 - row * 42}`} />
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={i} d={`M${62 + i * 46 + (row % 2) * 23},${310 - row * 42} v-42`} />
          ))}
        </g>
      ))}
      <path d="M40,310 L40,200 C40,80 110,26 200,26 C290,26 360,80 360,200 L360,310" fill="none" stroke="#5d2314" strokeWidth="6" />
      {/* the opening */}
      <path d="M118,310 L118,236 C118,176 282,176 282,236 L282,310 Z" fill="#1a0d08" />
      <path d="M130,310 L130,238 C130,190 270,190 270,238 L270,310 Z" fill="url(#ovenGlow)" />
      {/* flames */}
      {[[170, 0], [200, 0.6], [230, 0.3]].map(([x, delay], i) => (
        <motion.path
          key={i}
          d={`M${x},306 C${x - 18},282 ${x - 6},262 ${x},238 C${x + 6},262 ${x + 18},282 ${x},306Z`}
          fill={i === 1 ? "#ffe39a" : "#ff9a2e"}
          style={{ originX: "50%", originY: "100%", transformBox: "fill-box" }}
          animate={{ scaleY: [1, 1.22, 0.92, 1], scaleX: [1, 0.9, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2.6, delay, ease: "easeInOut" }}
        />
      ))}
      {/* chimney smoke */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="200"
          cy="26"
          r="9"
          fill="#f4ead8"
          initial={{ opacity: 0 }}
          animate={{ y: [0, -70], opacity: [0, 0.35, 0], scale: [0.6, 2.2] }}
          transition={{ repeat: Infinity, duration: 6, delay: i * 2, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

const facts = [
  ["48", "hours", "of dough fermentation"],
  ["450", "°C", "oven floor temperature"],
  ["5", "min", "from raw to blistered"]
];

export default function Story() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const words = paragraph.split(" ");

  return (
    <section className="story" id="story" ref={ref}>
      <div className="story-inner">
        <p className="eyebrow eyebrow-light">Our oven</p>
        <p className="story-text">
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1.5) / words.length]}>
              {word}
            </Word>
          ))}
        </p>

        <div className="story-grid">
          <motion.div
            className="story-oven"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Oven />
          </motion.div>

          <ul className="facts">
            {facts.map(([big, unit, label], i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.1, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="fact-num">
                  {big}
                  <small>{unit}</small>
                </span>
                <span className="fact-label">{label}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
