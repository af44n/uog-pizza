import { createContext, useContext, useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------
   Two pieces of shared state for the whole website:
   1. the menu, loaded from our Express/MongoDB API
   2. the cart, kept in the browser so it survives a refresh
------------------------------------------------------------------- */

const MenuContext = createContext(null);
const CartContext = createContext(null);

export const useMenu = () => useContext(MenuContext);
export const useCart = () => useContext(CartContext);

// 1400 -> "Rs 1,400"
export const money = (n) => "Rs " + Math.round(n).toLocaleString("en-US");

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState({ products: [], sizes: {}, freeDeliveryOver: 3000, deliveryFee: 150 });
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => {
        if (!res.ok) throw new Error("Menu request failed");
        return res.json();
      })
      .then((data) => {
        setMenu(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return <MenuContext.Provider value={{ ...menu, status }}>{children}</MenuContext.Provider>;
}

export function CartProvider({ children }) {
  const { products, sizes, freeDeliveryOver, deliveryFee } = useMenu();

  // The cart only stores ids, sizes and quantities. Prices come from the menu.
  const [lines, setLines] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("uog-cart")) || [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("uog-cart", JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const priceOf = (product, size) =>
    product.sized ? Math.round(product.price * (sizes[size] || 1)) : product.price;

  // Join cart lines with product info (drop anything no longer on the menu)
  const items = useMemo(
    () =>
      lines
        .map((line) => {
          const product = products.find((p) => p._id === line.productId);
          return product ? { ...line, product, unitPrice: priceOf(product, line.size) } : null;
        })
        .filter(Boolean),
    [lines, products, sizes]
  );

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const delivery = items.length === 0 || subtotal >= freeDeliveryOver ? 0 : deliveryFee;
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  const add = (product, size) => {
    const key = product._id + "-" + size;
    setLines((current) => {
      const found = current.find((l) => l.key === key);
      if (found) return current.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...current, { key, productId: product._id, size, qty: 1 }];
    });
    setOpen(true);
  };

  const change = (key, amount) =>
    setLines((current) =>
      current.map((l) => (l.key === key ? { ...l, qty: l.qty + amount } : l)).filter((l) => l.qty > 0)
    );

  const clear = () => setLines([]);

  return (
    <CartContext.Provider
      value={{ items, subtotal, delivery, total: subtotal + delivery, count, add, change, clear, open, setOpen, priceOf, freeDeliveryOver }}
    >
      {children}
    </CartContext.Provider>
  );
}
