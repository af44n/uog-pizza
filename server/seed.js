// Fills the database with the menu: npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const menu = [
  // ---- Pizzas (price is for Medium) ----
  { slug: "margherita", name: "Margherita", category: "Pizza", sized: true, price: 1100, art: "margherita",
    description: "San Marzano tomato, fior di latte, torn basil and a thread of olive oil.", tags: ["Veg", "Classic"] },
  { slug: "pepperoni", name: "Pepperoni Fire", category: "Pizza", sized: true, price: 1400, art: "pepperoni",
    description: "Cupped pepperoni, mozzarella and chilli honey. Crisp edges, hot centre.", tags: ["Bestseller"] },
  { slug: "tikka", name: "Chicken Tikka", category: "Pizza", sized: true, price: 1500, art: "tikka",
    description: "Tandoori-marinated chicken, red onion, green chilli and mint raita drizzle.", tags: ["Spicy", "Campus favourite"] },
  { slug: "malai-boti", name: "Malai Boti", category: "Pizza", sized: true, price: 1600, art: "malai",
    description: "Creamy malai boti chunks, roasted capsicum and a smoky white sauce.", tags: [] },
  { slug: "fajita", name: "Fajita Supreme", category: "Pizza", sized: true, price: 1450, art: "fajita",
    description: "Peppers, onions, jalapeños and seasoned chicken on a garlic base.", tags: ["Spicy"] },
  { slug: "garden", name: "Garden Harvest", category: "Pizza", sized: true, price: 1250, art: "garden",
    description: "Mushroom, olives, sweet corn, peppers and roasted garlic.", tags: ["Veg"] },
  { slug: "quattro", name: "Four Cheese", category: "Pizza", sized: true, price: 1550, art: "cheese",
    description: "Mozzarella, cheddar, parmesan and blue cheese, finished with honey.", tags: ["Veg"] },

  // ---- Sides ----
  { slug: "garlic-bread", name: "Garlic Bread", category: "Sides", price: 450, art: "bread",
    description: "Stone-baked, brushed with garlic butter and parsley.", tags: ["Veg"] },
  { slug: "wings", name: "Dynamite Wings", category: "Sides", price: 650, art: "wings",
    description: "Six crispy wings tossed in a sweet, sticky chilli glaze.", tags: ["Spicy"] },
  { slug: "fries", name: "Loaded Fries", category: "Sides", price: 500, art: "fries",
    description: "Skin-on fries, cheese sauce, jalapeño and pizza seasoning.", tags: [] },

  // ---- Drinks ----
  { slug: "mint-margarita", name: "Mint Margarita", category: "Drinks", price: 350, art: "drink-green",
    description: "Fresh mint, lemon and soda over crushed ice.", tags: ["Bestseller"] },
  { slug: "cold-coffee", name: "Cold Coffee", category: "Drinks", price: 400, art: "drink-brown",
    description: "Slow-brewed coffee, milk and a scoop of vanilla ice cream.", tags: [] },
  { slug: "cola", name: "Cola", category: "Drinks", price: 150, art: "drink-red",
    description: "Ice-cold 345ml can.", tags: [] },

  // ---- Dessert ----
  { slug: "lava-cake", name: "Choco Lava Cake", category: "Dessert", price: 550, art: "cake",
    description: "Warm chocolate cake with a molten centre and vanilla cream.", tags: ["Veg"] },
  { slug: "nutella-calzone", name: "Nutella Calzone", category: "Dessert", price: 600, art: "calzone",
    description: "Folded pizza dough filled with Nutella and banana, dusted with sugar.", tags: ["Veg"] }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(menu.map((p, i) => ({ ...p, order: i })));
  console.log("Seeded " + menu.length + " menu items.");
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
