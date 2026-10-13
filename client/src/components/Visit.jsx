import { motion } from "motion/react";

const cards = [
  { title: "Find us", lines: ["Main Gate Plaza", "Hafiz Hayat Campus", "University of Gujarat, Gujrat"] },
  { title: "Open", lines: ["Mon – Thu   12 pm – 1 am", "Fri – Sun   12 pm – 2 am", "Kitchen closes 30 min early"] },
  { title: "Delivery", lines: ["Both campuses and hostels", "30 – 40 minutes", "Free over Rs 3,000"] }
];

export default function Visit() {
  return (
    <section className="section visit" id="visit">
      <div className="section-head">
        <p className="eyebrow">Visit</p>
        <h2 className="section-title">Come hungry.</h2>
      </div>
      <div className="visit-grid">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="visit-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3>{card.title}</h3>
            {card.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
