// A slow, endlessly scrolling strip of words (the animation lives in the CSS)
const words = ["Margherita", "Pepperoni Fire", "Chicken Tikka", "Malai Boti", "Fajita Supreme", "Four Cheese", "Garden Harvest"];

export default function Marquee() {
  const row = (
    <div className="marquee-row" aria-hidden="true">
      {words.map((w) => (
        <span key={w}>
          {w}
          <i />
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}
