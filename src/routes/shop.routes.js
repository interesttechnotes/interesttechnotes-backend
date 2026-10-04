import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  createShop,
  getMyShops,
  getShop,
  updateShop,
  getStorefront,
} from "../controllers/shop.controller.js";

const router = express.Router();

// Public: must stay ABOVE router.use(verifyToken) and above "/:id"
router.get("/storefront", getStorefront);

// Everything below needs a logged-in user
router.use(verifyToken);

router.post("/", createShop); // create a shop
router.get("/", getMyShops); // list the logged-in user's shops
router.get("/:id", getShop); // one shop (owner only)
router.put("/:id", updateShop); // update a shop (owner only)

export default router;
