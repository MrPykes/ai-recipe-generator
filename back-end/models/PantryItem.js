import db from "../config/db.js";

class PantryItem {
  // create new pantry item
  static async create(userId, item) {
    const {
      name,
      quantity,
      unit,
      category,
      expiry_date,
      is_running_low = false,
    } = item;
    const result = await db.query(
      `INSERT INTO pantry_items 
      (user_id, name, quantity, unit, category, expiry_date, is_running_low)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, name, quantity, unit, category, expiry_date, is_running_low],
    );
    return result.rows[0];
  }

  //   get all pantry items for a user
  static async findByUserId(userId, filters = {}) {
    let query = "SELECT * FROM pantry_items WHERE user_id = $1";
    const params = [userId];
    let paramIndex = 1;

    if (filters.category) {
      paramIndex++;
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
    }

    if (filters.is_running_low !== undefined) {
      paramIndex++;
      query += ` AND is_running_low = $${paramIndex}`;
      params.push(filters.is_running_low);
    }

    if (filters.search) {
      paramIndex++;
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
    }

    query += " ORDER BY created_at ASC";

    const result = await db.query(query, params);
    return result.rows;
  }

  //   get item expiring soon (within 7 days)
  static async findExpiringSoon(userId, days = 7) {
    const result = await db.query(
      `SELECT * FROM pantry_items 
      WHERE user_id = $1 
      AND expiry_date IS NOT NULL 
      AND expiry_date <= CURRENT_DATE + INTERVAL '${days} days' 
      AND expiry_date >= CURRENT_DATE 
      ORDER BY expiry_date ASC`,
      [userId],
    );
    return result.rows;
  }

  //   get item by id
  static async findById(itemId, userId) {
    const result = await db.query(
      "SELECT * FROM pantry_items WHERE user_id = $1 AND id = $2",
      [userId, itemId],
    );
    return result.rows[0] || null;
  }

  //   update pantry item
  static async update(itemId, userId, updates) {
    const { name, quantity, unit, category, expiry_date, is_running_low } =
      updates;

    const result = await db.query(
      `UPDATE pantry_items SET 
      name = COALESCE($1, name),
        quantity = COALESCE($2, quantity),
        unit = COALESCE($3, unit),
        category = COALESCE($4, category),
        expiry_date = COALESCE($5, expiry_date),
        is_running_low = COALESCE($6, is_running_low)
        WHERE id = $7 AND user_id = $8
        RETURNING *`,
      [
        name,
        quantity,
        unit,
        category,
        expiry_date,
        is_running_low,
        itemId,
        userId,
      ],
    );
    return result.rows[0] || null;
  }

  //   delete pantry item
  static async delete(itemId, userId) {
    await db.query("DELETE FROM pantry_items WHERE id = $1 AND user_id = $2", [
      itemId,
      userId,
    ]);
  }

  //   get pantry stats
  static async getStats(userId) {
    const result = await db.query(
      `SELECT 
      COUNT(*) AS total_items,
      COUNT(DISTINCT category) AS total_categories,
      COUNT(*) FILTER (WHERE is_running_low) AS running_low_items,
      COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND expiry_date >= CURRENT_DATE) AS expiring_soon_items
      FROM pantry_items
      WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0];
  }
}

export default PantryItem;
