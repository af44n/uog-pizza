# UOG Pizza

A pizza ordering website built with the **MERN stack**: MongoDB, Express, React and Node.js.

## What it does
- Landing page with animated hero, scrolling menu strip, story section and visit info
- Menu loaded from MongoDB, filtered by category, with pizza sizes
- Cart (saved in the browser), free-delivery progress bar
- Checkout form with validation, order saved to MongoDB
- Order confirmation page with an order code and a progress tracker

## Project structure
```
uog-pizza/
├── api/index.js          Vercel serverless entry (hands requests to Express)
├── server/               Backend (Express + Mongoose)
│   ├── app.js            Express app and middleware
│   ├── db.js             MongoDB connection (cached for serverless)
│   ├── models/           Product and Order schemas
│   ├── routes/           /api/menu and /api/orders
│   ├── pricing.js        Sizes, delivery fee (prices are calculated on the server)
│   └── seed.js           Fills the database with the menu
└── client/               Frontend (React + Vite)
    └── src/
        ├── components/   Hero, Menu, Story, Cart drawer, SVG art...
        ├── pages/        Home, Checkout, Order
        └── store.jsx     Menu and cart state
```

## API
| Method | Route               | What it does                         |
|--------|---------------------|--------------------------------------|
| GET    | `/api/menu`         | All menu items and pricing rules     |
| POST   | `/api/orders`       | Place an order                       |
| GET    | `/api/orders/:code` | Look up an order by its code         |

## Run it locally
1. Start MongoDB: `docker run -d -p 27017:27017 --name uog-mongo mongo:7`
2. Copy `.env.example` to `.env`
3. `npm run install:all`
4. `npm run seed` (loads the menu into the database)
5. `npm run dev` then open http://localhost:5173

Add `?nointro` to the address to skip the opening animation.

## Deploy to Vercel
1. Create a free MongoDB Atlas cluster and copy its connection string.
2. `vercel` to link the project, then add `MONGODB_URI` as an environment variable.
3. Run `npm run seed` once with `MONGODB_URI` pointing at Atlas.
4. `vercel --prod`
