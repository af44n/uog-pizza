# UOG Pizza

A pizza ordering website built with the **MERN stack**: MongoDB, Express, React and Node.js.

## What it does
**Website (customers):**
- Landing page with animated hero, scrolling menu strip, story section and visit info
- Menu loaded from MongoDB, filtered by category, with pizza sizes
- Cart (saved in the browser), free-delivery progress bar
- Checkout form with validation, order saved to MongoDB
- Order confirmation page with an order code and a live progress tracker

**POS (staff) at `/pos`, protected by a PIN:**
- **Counter:** dine-in, takeaway and phone-in delivery orders; table number, kitchen notes, menu search, % or Rs discounts, cash (with change and quick amounts) or card, printable receipt, and "hold" a ticket while a customer decides
- **Orders:** website and counter orders with search, source filter, waiting time, reprint receipt, cancel with a reason (stock goes back)
- **Kitchen:** a big board (New / Baking / Ready) for the kitchen screen; a beep and a badge when a new order arrives
- **Sales:** revenue, average, cash in the till, discounts, cancellations, orders by hour, last 7 days, best sellers, and CSV export
- **Menu:** mark items sold out, edit prices, add/remove items, and optional stock counts (an item sells out by itself at 0)

## Project structure
Follows the "MERN Stack Setup Guide": a `server/` and a `client/` folder side by side, each with its own `package.json`.
```
uog-pizza/
├── server/               Backend (Express + Mongoose), run on its own
│   ├── index.js          Starts the server
│   ├── app.js            Express app and middleware
│   ├── db.js             MongoDB connection
│   ├── .env              MONGODB_URI, PORT, POS_PIN (see .env.example)
│   ├── models/           Product and Order schemas
│   ├── routes/           menu, orders and staff (POS) routes
│   ├── pricing.js        Sizes and delivery fee (prices are calculated on the server)
│   ├── orderService.js   Builds orders (shared by the website and the counter)
│   ├── seed.js           Fills the database with the menu
│   └── package.json
├── client/               Frontend (React + Vite + axios)
│   ├── src/              components/, pages/, pos/, api.js, App.jsx, main.jsx
│   ├── package.json
│   └── vite.config.js
└── api/index.js          Only used by Vercel, to run the Express app as a function
```

## API
| Method | Route               | What it does                         |
|--------|---------------------|--------------------------------------|
| GET    | `/api/menu`         | All menu items and pricing rules     |
| POST   | `/api/orders`       | Place an order                       |
| *      | `/api/staff/*`      | POS: login, orders, summary, report.csv, products (needs `x-staff-pin` header) |
| GET    | `/api/orders/:code` | Look up an order by its code         |

## Run it locally
1. Start MongoDB: `docker run -d -p 27017:27017 --name uog-mongo mongo:7`
2. `cp server/.env.example server/.env` (the POS PIN defaults to `1234` locally)
3. Install: `cd server && npm install`, then `cd ../client && npm install` (or `npm run install:all` from the root)
4. Load the menu: `cd server && npm run seed`
5. Two terminals, like in the guide:
   - Terminal 1: `cd server && npm run dev` (or `node index.js`), API on port 5000
   - Terminal 2: `cd client && npm run dev`, then open http://localhost:5173

Add `?nointro` to the address to skip the opening animation.

## Deploy to Vercel
1. Create a free MongoDB Atlas cluster and copy its connection string.
2. `vercel` to link the project, then add `MONGODB_URI` and `POS_PIN` (the staff PIN) as environment variables.
3. Run `cd server && npm run seed` once with `MONGODB_URI` pointing at Atlas.
4. `vercel --prod`
