import * as shopService from "../services/shop.service.js";

// ---------- helpers ----------
const getOwnerId = (req) => String(req.user.id);

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Accepts a JSON string or an object. Returns { value } or { error }.
const parseDriveJson = (input) => {
  try {
    const parsed = typeof input === "string" ? JSON.parse(input) : input;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Google Drive JSON must be a JSON object." };
    }
    return { value: parsed };
  } catch {
    return { error: "Google Drive JSON is not valid JSON." };
  }
};

const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";

// ---------- handlers ----------
export const createShop = async (req, res) => {
  try {
    const { shopName, description, googleDriveJson } = req.body;

    if (isBlank(shopName)) {
      return res.status(400).json({ message: "Shop name is required." });
    }
    if (isBlank(googleDriveJson)) {
      return res
        .status(400)
        .json({ message: "Google Drive JSON is required." });
    }

    const drive = parseDriveJson(googleDriveJson);
    if (drive.error) return res.status(400).json({ message: drive.error });

    const shop = await shopService.createShop({
      ownerId: getOwnerId(req),
      shopName: shopName.trim(),
      description: (description || "").trim(),
      googleDriveJson: drive.value,
    });

    res.status(201).json({ message: "Shop created", shop });
  } catch (error) {
    console.error("❌ Create Shop Error:", error.message);
    res.status(500).json({ message: "Server error while creating shop" });
  }
};

export const getMyShops = async (req, res) => {
  try {
    const shops = await shopService.getShopsByOwner(getOwnerId(req));
    res.status(200).json({ shops });
  } catch (error) {
    console.error("❌ Get Shops Error:", error.message);
    res.status(500).json({ message: "Server error while fetching shops" });
  }
};

export const getShop = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop id." });

    const shop = await shopService.getShopById(id, getOwnerId(req));
    if (!shop) return res.status(404).json({ message: "Shop not found." });

    res.status(200).json({ shop });
  } catch (error) {
    console.error("❌ Get Shop Error:", error.message);
    res.status(500).json({ message: "Server error while fetching shop" });
  }
};

export const updateShop = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid shop id." });

    const { shopName, description, googleDriveJson } = req.body;

    if (shopName !== undefined && isBlank(shopName)) {
      return res.status(400).json({ message: "Shop name cannot be empty." });
    }

    // Drive JSON is optional on update: omit it to keep the stored one.
    let driveValue;
    if (!isBlank(googleDriveJson)) {
      const drive = parseDriveJson(googleDriveJson);
      if (drive.error) return res.status(400).json({ message: drive.error });
      driveValue = drive.value;
    }

    const shop = await shopService.updateShop(id, getOwnerId(req), {
      shopName: shopName?.trim(),
      description: description?.trim(),
      googleDriveJson: driveValue,
    });

    if (!shop) return res.status(404).json({ message: "Shop not found." });

    res.status(200).json({ message: "Shop updated", shop });
  } catch (error) {
    console.error("❌ Update Shop Error:", error.message);
    res.status(500).json({ message: "Server error while updating shop" });
  }
};

// Public: shops (newest updated first) with their latest Drive files.
// GET /api/shops/storefront?limit=5&productLimit=5
const clamp = (value, fallback, max) => {
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
};

export const getStorefront = async (req, res) => {
  try {
    const limit = clamp(req.query.limit, 5, 20);
    const productLimit = clamp(req.query.productLimit, 5, 20);

    const shops = await shopService.getStorefront({ limit, productLimit });
    res.status(200).json({ shops });
  } catch (error) {
    console.error("❌ Storefront Error:", error.message);
    res.status(500).json({ message: "Server error while loading shops" });
  }
};
