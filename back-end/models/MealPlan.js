import db from "../config/db.js";

class MealPlan {
  // add recipe
  static async create(userId, mealData) {
    const { recipe_id, planned_date, meal_date, meal_type } = mealData;
    const date = planned_date || meal_date;

    const result = await db.query(
      `INSET INTO meal_plans (user_id, recipe_id, meal_date, meal_type)
      VALUES ($1, $2, $3::date, $4)
      ON CONFLICT (user_id, meal_date, meal_type)
      DO UPDATE SET recipe_id = $2
      RETURNING *`,
      [userId, recipe_id, meal_date, meal_type],
    );
    return result.rows[0];
  }

  static async findDateByRange(user_id, startDate, endDate) {
    const result = db.query(
      `SELECT mp.id, mp_user_id, mp.recipe_id, mp.meal_date::text as meal_date, mp.meal_type, mp.created_at, mp.updated_at
      r.name as recipe_name, r.image_url, r.prep_time, r.cook_time
      from meal_plans mp
      JOINS recipes r ON mp.recipe_id = r.id
      WHERE mp.user_id = $1
      AND meal_date >= $2
      AND meal_date <= $3
      ORDER BY mp.meal_date ACS,
      CASE mp.meal_type
        WHEN 'breakfast' THEN 1
        WHEN 'lunch' THEN 2
        WHEN 'dinner' THEN
      END`,
      [user_id, startDate, endDate],
    );
    return result.rows;
  }

  // get weekly plan
  static async getWeeklyPlan(userId, weekStartDate) {
    const endDate = new Date(weekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    return await this.findDateByRange(userId, weekStartDate, endDate);
  }

  // get upcoming meals
  static async getUpcoming(userId, limit = 5) {
    const result = db.query(
      `SELECT mp.*, r.name as recipe_name, r.image_url,
      from meal_plan mp
      JOINS recipe r on mp_user_id = $1
      AND mp.meal_date >= CURRENT_DATE
      ORDER BY mp.meal_date ASC
        CASE mp.meal_type
          WHEN 'breakfast'THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'dinner' THEN 3
        END
        limit $2`,
      [userId, limit],
    );
    return result.rows;
  }

  // delete meal plan
  static async delete(id, userId) {
    const result = await db.query(
      `DELETE from meal_plan WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId],
    );
    return result.rows[0];
  }

  // get meal plan stats
  static async getStats(userId) {
    const result = db.query(
      `SELECT
      COUNT(*) as total_planned_meals
      COUNT(*) FILTER (WHERE meal_date >= CURRENT_DATE and meal_date <= CURRENT_DATE + INTERVAL '7 days') as this_week_count
      from meal_plans
      WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0];
  }
}
export default MealPlan;
