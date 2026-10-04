import { neonQuery } from "../db/neonPostgresDB.js";

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
export const createShop = async ({ ownerId, shopName, description, googleDriveJson }) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `INSERT INTO shops (name, description, owner_user_id, google_drive_json)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING ${SHOP_COLUMNS}`,
    [shopName, description, ownerId, JSON.stringify(googleDriveJson)]
  );
  return toShop(rows[0]);
};

export const getShopsByOwner = async (ownerId) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `SELECT ${SHOP_COLUMNS} FROM shops
     WHERE owner_user_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );
  return rows.map(toShop);
};

export const getShopById = async (id, ownerId) => {
  await ensureTable();
  const { rows } = await neonQuery(
    `SELECT ${SHOP_COLUMNS} FROM shops
     WHERE id = $1 AND owner_user_id = $2`,
    [id, ownerId]
  );
  return toShop(rows[0]) || null;
};

// Fields passed as null/undefined are left unchanged.
export const updateShop = async (id, ownerId, { shopName, description, googleDriveJson }) => {
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
    ]
  );
  return toShop(rows[0]) || null;
};