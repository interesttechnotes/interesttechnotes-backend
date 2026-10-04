import { neonQuery } from "../db/neonPostgresDB.js";
import { getLatestFiles } from "../utils/shopDrive.js";

// ---------- Table setup (runs once, on first use) ----------
let tableReady = null;

const ensureTable = () => {
  if (!tableReady) {
    tableReady = neonQuery(`
      CREATE TABLE IF NOT EXISTS shops (
        id               SERIAL PRIMARY KEY,
        name             VARCHAR(150) NOT NULL,
        description      TEXT NOT NULL DEFAULT '',
        owner_user_id    TEXT NOT NULL,
        google_drive_json JSONB NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops (owner_user_id);
    `).catch((err) => {
      tableReady = null; // allow retry on next call
      throw err;
    });
  }
  return tableReady;
};

// google_drive_json is a credential, so it is NEVER selected back to the client.
// We only expose a boolean saying whether one is stored.
const SHOP_COLUMNS = `
  id, name, description, owner_user_id,
  (google_drive_json IS NOT NULL) AS has_drive_json,
  created_at, updated_at
`;

const toShop = (row) =>
  row && {
    id: row.id,
    shopName: row.name,
    description: row.description,
    hasDriveJson: row.has_drive_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

// ---------- Queries ----------
export const createShop = async ({
  ownerId,
  shopName,
  description,
  googleDriveJson,
}) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `INSERT INTO shops (name, description, owner_user_id, google_drive_json)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING ${SHOP_COLUMNS}`,
    [shopName, description, ownerId, JSON.stringify(googleDriveJson)],
  );
  return toShop(rows[0]);
};

export const getShopsByOwner = async (ownerId) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `SELECT ${SHOP_COLUMNS} FROM shops
     WHERE owner_user_id = $1
     ORDER BY created_at DESC`,
    [ownerId],
  );
  return rows.map(toShop);
};

export const getShopById = async (id, ownerId) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `SELECT ${SHOP_COLUMNS} FROM shops
     WHERE id = $1 AND owner_user_id = $2`,
    [id, ownerId],
  );
  return toShop(rows[0]) || null;
};

// Fields passed as null/undefined are left unchanged.
export const updateShop = async (
  id,
  ownerId,
  { shopName, description, googleDriveJson },
) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `UPDATE shops
     SET name              = COALESCE($1, name),
         description       = COALESCE($2, description),
         google_drive_json = COALESCE($3::jsonb, google_drive_json),
         updated_at        = NOW()
     WHERE id = $4 AND owner_user_id = $5
     RETURNING ${SHOP_COLUMNS}`,
    [
      shopName ?? null,
      description ?? null,
      googleDriveJson ? JSON.stringify(googleDriveJson) : null,
      id,
      ownerId,
    ],
  );
  return toShop(rows[0]) || null;
};

// ---------- Storefront (public listing: shops + their latest Drive files) ----------
const driveCache = new Map();
const CACHE_MS = 60 * 1000; // avoid hitting Drive on every page load

const getCachedFiles = async (shop, productLimit) => {
  // updated_at in the key means editing a shop (e.g. new JSON) busts its cache
  const key = `${shop.id}:${shop.updated_at.getTime()}:${productLimit}`;
  const hit = driveCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.files;

  const files = await getLatestFiles(shop.google_drive_json, productLimit);
  if (driveCache.size > 200) driveCache.clear();
  driveCache.set(key, { files, expires: Date.now() + CACHE_MS });
  return files;
};

export const getStorefront = async ({ limit, productLimit }) => {
  await ensureTable();

  // Newest-updated shops first. The credentials are read here only to call
  // Drive and are never included in the returned objects.
  const { rows } = await neonQuery(
    `SELECT id, name, description, google_drive_json, updated_at
     FROM shops
     ORDER BY updated_at DESC
     LIMIT $1`,
    [limit],
  );

  // One Drive call per shop, in parallel. A broken shop doesn't break the page.
  return Promise.all(
    rows.map(async (row) => {
      let products = [];
      let productsError = false;
      try {
        products = await getCachedFiles(row, productLimit);
      } catch (err) {
        console.error(`❌ Drive error for shop ${row.id}:`, err.message);
        productsError = true;
      }
      return {
        id: row.id,
        shopName: row.name,
        description: row.description,
        updatedAt: row.updated_at,
        products,
        productsError,
      };
    }),
  );
};

// INTERNAL USE ONLY (payments): returns the stored Drive credentials.
// Never send this object to the client.
export const getShopCredentials = async (id) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `SELECT id, name, google_drive_json FROM shops WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
};
