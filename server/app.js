require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Make sure the database is connected before any /api route runs
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/orders", require("./routes/orders"));

// Any error ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
});

module.exports = app;
