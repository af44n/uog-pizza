import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMenu, useCart, money } from "../store.jsx";
import Art from "./Art.jsx";

const categories = ["Pizza", "Sides", "Drinks", "Dessert"];
const sizeNames = ["Small", "Medium", "Large"];

function ProductCard({ product, index }) {
  const { sizes } = useMenu();
  const { add } = useCart();
  const [size, setSize] = useState("Medium");

  const price = product.sized ? Math.round(product.price * (sizes[size] || 1)) : product.price;

  return (
    <motion.article
      className="card"
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.9, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="card-art">
        <motion.div whileHover={{ rotate: 25, scale: 1.06 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
          <Art kind={product.art} seed={index + 2} />
        </motion.div>
      </div>

      <div className="card-tags">
        {product.tags.map((tag) => (
          <span key={tag} className={"tag" + (tag === "Spicy" ? " tag-hot" : "")}>{tag}</span>
        ))}
      </div>

      <h3>{product.name}</h3>
      <p className="card-desc">{product.description}</p>

      {product.sized && (
        <div className="sizes" role="radiogroup" aria-label={"Size for " + product.name}>
          {sizeNames.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={size === s}
              className={size === s ? "on" : ""}
              onClick={() => setSize(s)}
            >
              {s[0]}
              <small>{s}</small>
            </button>
          ))}
        </div>
      )}

      <div className="card-buy">
        <strong className="price">{money(price)}</strong>
        <button
          className="btn btn-small btn-primary"
          disabled={!product.available}
          onClick={() => add(product, product.sized ? size : "Regular")}
        >
          {product.available ? "Add" : "Sold out"}
        </button>
      </div>
    </motion.article>
  );
}

export default function MenuSection() {
  const { products, status } = useMenu();
  const [category, setCategory] = useState("Pizza");
  const visible = products.filter((p) => p.category === category);

  return (
    <section className="section menu" id="menu">
      <div className="section-head">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          The menu
        </motion.p>
        <h2 className="section-title">
          {/* the trigger sits on the outer span, because the masked inner span is clipped and never counts as "in view" */}
          <motion.span className="mask" initial="hidden" whileInView="shown" viewport={{ once: true }}>
            <motion.span
              className="mask-inner"
              variants={{ hidden: { y: "115%" }, shown: { y: 0 } }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Pick your <em>fire.</em>
            </motion.span>
          </motion.span>
        </h2>
      </div>

      <div className="tabs" role="tablist">
        {categories.map((c) => (
          <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={category === c ? "on" : ""}>
            {category === c && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />}
            <span className="tab-label">{c}</span>
          </button>
        ))}
      </div>

      {status === "loading" && <p className="menu-note">Firing up the oven…</p>}
      {status === "error" && (
        <p className="menu-note">
          We couldn't load the menu. Make sure the server is running, then{" "}
          <button className="link" onClick={() => window.location.reload()}>try again</button>.
        </p>
      )}

      <motion.div className="grid" layout>
        <AnimatePresence mode="popLayout">
          {visible.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
