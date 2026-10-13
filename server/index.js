// Starts the API on your own computer (npm run server). On Vercel, api/index.js is used instead.
const app = require("./app");
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("UOG Pizza API running on http://localhost:" + PORT));
