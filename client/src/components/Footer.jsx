export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-big" aria-hidden="true">UOG PIZZA</p>
      <div className="footer-row">
        <span>© {new Date().getFullYear()} UOG Pizza</span>
        <span>Built with MongoDB, Express, React and Node</span>
      </div>
    </footer>
  );
}
