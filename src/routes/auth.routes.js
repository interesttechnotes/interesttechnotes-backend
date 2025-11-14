import express from "express";
console.log("🚀 ROUTER LOADED from:", import.meta.url);
console.log("🚀 Express version:", express?.name || "unknown");

const router = express.Router();
console.log("🚀 Router created. Type:", typeof router, "Constructor:", router.constructor.name);

import { signup, login, googleAuth } from "../controllers/auth.controller.js";

router.get("/test", (req, res) => res.json({ ok: true }));
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
export default router;
