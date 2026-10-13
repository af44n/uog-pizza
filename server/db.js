const mongoose = require("mongoose");

// Serverless functions on Vercel start and stop all the time, so we keep the
// connection on a global variable and reuse it instead of reconnecting for every request.
let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
