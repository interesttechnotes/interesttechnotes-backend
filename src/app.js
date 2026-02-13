import express from "express";
import cors from "cors";
import { connectDB } from "./db/db.js";
import authRoutes from "./routes/auth.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import productRoutes from "./routes/product.routes.js";
import fileRoutes from "./routes/files.routes.js";
// import addressRoutes from "./routes/address.routes.js";
// import orderRoutes from "./routes/order.routes.js";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";


dotenv.config(); // Load env variables

const app = express();
app.use(cookieParser());

// Middleware
app.use(express.json());

// Connect DB
connectDB();

// Allow requests from frontend
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // if you need cookies
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
// app.use("/api/products", productRoutes);
app.use("/api/products", fileRoutes);
// app.use("/api/address", addressRoutes);
// app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

export default app;
