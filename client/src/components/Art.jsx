import { useId, useMemo } from "react";

/* ------------------------------------------------------------------
   All the illustrations on the site are drawn here as SVG.
   Pizzas are built from layers (crust, sauce, cheese, toppings).
   Toppings are scattered with a seeded random number generator, so a
   pizza always looks the same but each kind of pizza looks different.
------------------------------------------------------------------- */

// Small seeded random number generator (same seed -> same numbers)
function makeRandom(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks n points inside the pizza that are not too close to each other
function scatter(random, count, minDistance, maxRadius = 76) {
  const points = [];
  let tries = 0;
  while (points.length < count && tries < count * 80) {
    tries++;
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * maxRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (points.every((p) => Math.hypot(p.x - x, p.y - y) >= minDistance)) {
      points.push({ x, y, rotate: random() * 360, scale: 0.85 + random() * 0.35 });
    }
  }
  return points;
}

/* ---------- Individual toppings (each is drawn around 0,0) ---------- */

const toppings = {
  pepperoni: () => (
    <>
      <circle r="12" fill="#b52a19" />
      <circle r="12" fill="none" stroke="#7c1509" strokeWidth="1.6" />
      <circle cx="-4" cy="-3" r="1.7" fill="#7c1509" />
      <circle cx="3" cy="-5" r="1.4" fill="#7c1509" />
      <circle cx="4" cy="3" r="1.8" fill="#7c1509" />
      <circle cx="-3" cy="5" r="1.3" fill="#7c1509" />
    </>
  ),
  basil: () => (
    <>
      <path d="M0,-13 C10,-9 10,7 0,13 C-10,7 -10,-9 0,-13Z" fill="#4c8a38" />
      <path d="M0,-11 L0,11" stroke="#2f6324" strokeWidth="1.2" />
    </>
  ),
  mozzarella: () => (
    <>
      <circle r="13" fill="#fbf4e2" />
      <circle r="13" fill="none" stroke="#e8dcc0" strokeWidth="1.5" />
      <circle cx="-4" cy="-4" r="4" fill="#fff" opacity=".7" />
    </>
  ),
  chicken: () => (
    <>
      <path d="M-9,-3 C-8,-9 4,-10 9,-4 C11,3 5,9 -3,8 C-10,6 -11,1 -9,-3Z" fill="#cf6a28" />
      <path d="M-9,-3 C-8,-9 4,-10 9,-4 C11,3 5,9 -3,8 C-10,6 -11,1 -9,-3Z" fill="none" stroke="#8c3d12" strokeWidth="1.4" />
      <circle cx="-2" cy="-2" r="1.5" fill="#6b2a0a" />
      <circle cx="4" cy="2" r="1.3" fill="#6b2a0a" />
    </>
  ),
  creamyChicken: () => (
    <>
      <path d="M-9,-3 C-8,-9 4,-10 9,-4 C11,3 5,9 -3,8 C-10,6 -11,1 -9,-3Z" fill="#ecd9b0" />
      <path d="M-9,-3 C-8,-9 4,-10 9,-4 C11,3 5,9 -3,8 C-10,6 -11,1 -9,-3Z" fill="none" stroke="#c9ad78" strokeWidth="1.4" />
      <circle cx="1" cy="0" r="1.3" fill="#a88a52" />
    </>
  ),
  onion: () => <circle r="8" fill="none" stroke="#a2478f" strokeWidth="2.6" opacity=".95" />,
  chilli: () => (
    <>
      <path d="M-10,0 C-4,-5 5,-4 11,2 C5,1 -4,3 -10,0Z" fill="#3c9136" />
      <circle cx="-9" cy="0" r="1.4" fill="#2a6b25" />
    </>
  ),
  pepperRed: () => <rect x="-9" y="-3" width="18" height="6" rx="3" fill="#d6321f" />,
  pepperGreen: () => <rect x="-9" y="-3" width="18" height="6" rx="3" fill="#4f9a38" />,
  pepperYellow: () => <rect x="-9" y="-3" width="18" height="6" rx="3" fill="#f0b82a" />,
  jalapeno: () => (
    <>
      <circle r="6.5" fill="#cfe27a" />
      <circle r="6.5" fill="none" stroke="#5d9c33" strokeWidth="2.4" />
      <circle r="1.2" fill="#a0b84e" />
    </>
  ),
  mushroom: () => (
    <>
      <path d="M-10,3 C-10,-9 10,-9 10,3 Z" fill="#d9c4a2" />
      <rect x="-3" y="2" width="6" height="7" rx="2" fill="#efe1c7" />
      <path d="M-6,-1 C-3,-5 3,-5 6,-1" stroke="#b79f7a" strokeWidth="1.2" fill="none" />
    </>
  ),
  olive: () => (
    <>
      <circle r="5.2" fill="#2b2320" />
      <circle r="1.9" fill="#a3281b" />
    </>
  ),
  corn: () => <circle r="2.8" fill="#f3c531" />,
  cheddar: () => <circle r="11" fill="#f2a933" opacity=".92" />,
  parmesan: () => <circle r="9" fill="#f6dfa0" opacity=".95" />,
  blue: () => (
    <>
      <circle r="9" fill="#e9e4d4" />
      <circle cx="-2" cy="-1" r="1.6" fill="#6f8aa6" />
      <circle cx="3" cy="2" r="1.4" fill="#6f8aa6" />
    </>
  )
};

// What each pizza is made of: [topping, how many, minimum space between them]
const recipes = {
  margherita: { sauce: "#c9361f", layers: [["mozzarella", 9, 26], ["basil", 7, 18]] },
  pepperoni: { sauce: "#c9361f", layers: [["pepperoni", 13, 23], ["chilli", 5, 20]] },
  tikka: { sauce: "#c9361f", layers: [["chicken", 11, 21], ["onion", 8, 15], ["chilli", 6, 17]] },
  malai: { sauce: "#efe2c4", layers: [["creamyChicken", 11, 21], ["pepperYellow", 6, 18], ["pepperRed", 4, 18], ["basil", 3, 18]] },
  fajita: { sauce: "#c9361f", layers: [["chicken", 7, 22], ["pepperRed", 6, 17], ["pepperGreen", 6, 17], ["pepperYellow", 5, 17], ["jalapeno", 6, 17]] },
  garden: { sauce: "#c9361f", layers: [["mushroom", 7, 22], ["olive", 9, 14], ["pepperGreen", 5, 18], ["corn", 16, 8]] },
  cheese: { sauce: "#c9361f", layers: [["cheddar", 6, 24], ["parmesan", 6, 20], ["blue", 4, 22], ["basil", 3, 20]] }
};

/* ---------- The pizza ---------- */

export function Pizza({ kind = "pepperoni", seed = 3 }) {
  const uid = useId().replace(/:/g, "");
  const recipe = recipes[kind] || recipes.pepperoni;

  const parts = useMemo(() => {
    const random = makeRandom(seed * 101 + kind.length * 17);

    // melted cheese puddles under the toppings
    const cheese = scatter(random, 15, 14, 78).map((p, i) => (
      <circle key={"c" + i} cx={p.x} cy={p.y} r={13 + (i % 4) * 3} fill="#f6d684" opacity=".88" />
    ));

    // dark blisters on the crust
    const blisters = [];
    for (let i = 0; i < 26; i++) {
      const angle = random() * Math.PI * 2;
      const r = 94 + random() * 8;
      blisters.push(
        <circle key={"b" + i} cx={Math.cos(angle) * r} cy={Math.sin(angle) * r} r={1.6 + random() * 3} fill="#7a3a14" opacity=".55" />
      );
    }

    // the toppings
    const items = [];
    recipe.layers.forEach(([name, count, space], layer) => {
      scatter(random, count, space).forEach((p, i) => {
        items.push(
          <g key={name + layer + i} transform={`translate(${p.x} ${p.y}) rotate(${p.rotate}) scale(${p.scale})`}>
            {toppings[name]()}
          </g>
        );
      });
    });

    return { cheese, blisters, items };
  }, [kind, seed, recipe]);

  return (
    <svg viewBox="-110 -110 220 220" role="img" aria-label={kind + " pizza"}>
      <defs>
        <radialGradient id={uid + "crust"} cx="50%" cy="45%" r="60%">
          <stop offset="70%" stopColor="#e6a548" />
          <stop offset="100%" stopColor="#b86a22" />
        </radialGradient>
        <radialGradient id={uid + "shine"} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".22" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="106" fill="#000" opacity=".25" transform="translate(4 7)" />
      <circle r="105" fill={`url(#${uid}crust)`} />
      {parts.blisters}
      <circle r="91" fill="#d08a3a" />
      <circle r="88" fill={recipe.sauce} />
      {parts.cheese}
      {parts.items}
      <circle r="105" fill={`url(#${uid}shine)`} />
    </svg>
  );
}

/* ---------- Everything else on the menu ---------- */

const Bread = () => (
  <svg viewBox="0 0 200 200">
    {[-18, 0, 18].map((r, i) => (
      <g key={i} transform={`translate(100 108) rotate(${r}) translate(${(i - 1) * 4} ${i === 1 ? -8 : 0})`}>
        <rect x="-26" y="-62" width="52" height="124" rx="22" fill="#e2a24a" />
        <rect x="-26" y="-62" width="52" height="124" rx="22" fill="none" stroke="#a96a22" strokeWidth="3" />
        <path d="M-12,-40 L12,-34 M-12,-14 L12,-8 M-12,12 L12,18 M-12,38 L12,44" stroke="#5f9a3a" strokeWidth="5" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

const Wings = () => (
  <svg viewBox="0 0 200 200">
    {[[-30, 70, 110], [20, 118, 94], [-10, 96, 138]].map(([rot, x, y], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
        <rect x="-4" y="22" width="8" height="30" rx="4" fill="#f1e3c8" />
        <circle cx="-4" cy="52" r="6" fill="#f1e3c8" />
        <circle cx="4" cy="52" r="6" fill="#f1e3c8" />
        <ellipse cx="0" cy="0" rx="26" ry="32" fill="#c0391b" />
        <ellipse cx="-8" cy="-10" rx="9" ry="12" fill="#e2603a" opacity=".6" />
        <circle cx="10" cy="6" r="2" fill="#5a1708" /><circle cx="-3" cy="14" r="1.6" fill="#5a1708" />
      </g>
    ))}
  </svg>
);

const Fries = () => (
  <svg viewBox="0 0 200 200">
    {[-24, -12, 0, 12, 24].map((x, i) => (
      <rect key={i} x={96 + x - 5} y={34 + (i % 2) * 8} width="10" height="92" rx="3" fill="#f2c443" transform={`rotate(${x / 2} 100 130)`} />
    ))}
    <path d="M52,92 L148,92 L138,176 Q100,184 62,176 Z" fill="#c9311d" />
    <path d="M60,128 Q100,140 140,128" stroke="#f6d684" strokeWidth="12" fill="none" strokeLinecap="round" />
    <circle cx="86" cy="124" r="4" fill="#5d9c33" /><circle cx="112" cy="130" r="4" fill="#5d9c33" />
  </svg>
);

const Drink = ({ color, mint }) => (
  <svg viewBox="0 0 200 200">
    <rect x="104" y="14" width="9" height="70" rx="4" fill="#f4eadb" transform="rotate(12 108 50)" />
    <path d="M58,52 L142,52 L128,180 Q100,188 72,180 Z" fill={color} />
    <path d="M58,52 L142,52 L140,70 L60,70 Z" fill="#fff" opacity=".25" />
    <path d="M58,52 L142,52 L128,180 Q100,188 72,180 Z" fill="none" stroke="#f4eadb" strokeWidth="5" strokeLinejoin="round" />
    <rect x="76" y="86" width="26" height="26" rx="5" fill="#fff" opacity=".35" transform="rotate(-10 89 99)" />
    <rect x="102" y="116" width="24" height="24" rx="5" fill="#fff" opacity=".3" transform="rotate(14 114 128)" />
    {mint && <path d="M96,40 C106,28 124,32 126,46 C112,52 100,50 96,40Z" fill="#4c8a38" />}
  </svg>
);

const Cake = () => (
  <svg viewBox="0 0 200 200">
    <ellipse cx="100" cy="170" rx="70" ry="10" fill="#000" opacity=".25" />
    <path d="M44,100 C44,60 156,60 156,100 L150,160 Q100,174 50,160 Z" fill="#5a2c17" />
    <path d="M44,100 C44,60 156,60 156,100 C156,114 44,114 44,100Z" fill="#7a3c1f" />
    <path d="M78,96 C78,128 92,140 96,168 C104,150 112,128 122,96 Z" fill="#35160a" />
    <ellipse cx="100" cy="94" rx="22" ry="8" fill="#35160a" />
    <circle cx="136" cy="62" r="14" fill="#d6321f" /><path d="M136,48 q6,-10 12,-6" stroke="#4c8a38" strokeWidth="3" fill="none" />
  </svg>
);

const Calzone = () => (
  <svg viewBox="0 0 200 200">
    <path d="M24,134 C24,64 176,64 176,134 C176,150 24,150 24,134Z" fill="#e0a043" />
    <path d="M24,134 C24,64 176,64 176,134" fill="none" stroke="#a96a22" strokeWidth="5" />
    <path d="M40,132 q10,-14 20,0 t20,0 t20,0 t20,0 t20,0" stroke="#a96a22" strokeWidth="4" fill="none" />
    <path d="M60,100 C90,88 130,92 150,106" stroke="#4a2410" strokeWidth="9" strokeLinecap="round" fill="none" />
    {Array.from({ length: 30 }).map((_, i) => (
      <circle key={i} cx={52 + ((i * 37) % 100)} cy={86 + ((i * 53) % 44)} r="1.4" fill="#fff" opacity=".8" />
    ))}
  </svg>
);

/* ---------- One component to draw any menu item ---------- */

export default function Art({ kind, seed }) {
  if (recipes[kind]) return <Pizza kind={kind} seed={seed} />;
  switch (kind) {
    case "bread": return <Bread />;
    case "wings": return <Wings />;
    case "fries": return <Fries />;
    case "drink-green": return <Drink color="#79b555" mint />;
    case "drink-brown": return <Drink color="#8a5a3c" />;
    case "drink-red": return <Drink color="#b4281a" />;
    case "cake": return <Cake />;
    case "calzone": return <Calzone />;
    default: return <Pizza kind="pepperoni" seed={seed} />;
  }
}

/* ---------- Floating extras used in the hero ---------- */

export const FloatBasil = () => (
  <svg viewBox="-16 -16 32 32"><g transform="rotate(30)">{toppings.basil()}</g></svg>
);
export const FloatChilli = () => (
  <svg viewBox="-14 -8 28 16" style={{ overflow: "visible" }}>{toppings.chilli()}</svg>
);
export const FloatTomato = () => (
  <svg viewBox="-20 -20 40 40">
    <circle r="15" fill="#d1321e" /><circle cx="-5" cy="-5" r="4" fill="#fff" opacity=".35" />
    <path d="M0,-15 l-5,-5 M0,-15 l5,-5 M0,-15 l0,-7" stroke="#4c8a38" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
