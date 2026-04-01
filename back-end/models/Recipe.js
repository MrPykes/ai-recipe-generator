import db from "../config/db.js";

class Recipe {
  // Create new recipe with ingredients and nutritional info
  static async create(userId, recipe) {
    const { client } = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const {
        name,
        description,
        cuisine_type,
        difficulty,
        prep_time,
        servings,
        cook_time,
        instructions,
        dietary_tags,
        user_notes,
        image_url,
        ingredients = [],
        nutrition = {},
      } = recipe;

      // Insert recipe
      const recipeResult = await client.query(
        `INSERT INTO recipes 
            (user_id, name, description, cuisine_type, difficulty, instructions, servings, prep_time, cook_time, image_url, dietary_tags, user_notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
        [
          userId,
          name,
          description,
          cuisine_type,
          difficulty,
          JSON.stringify(instructions),
          servings,
          prep_time,
          cook_time,
          image_url,
          dietary_tags,
          user_notes,
        ],
      );
      const newRecipe = recipeResult.rows[0];

      // Insert ingredients
      if (ingredients.length > 0) {
        const ingredientValues = ingredients
          .map(
            (ing, index) =>
              `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`,
          )
          .join(", ");

        const ingredientParams = [newRecipe.id];
        ingredients.forEach((ing) => {
          ingredientParams.push(ing.name, ing.quantity, ing.unit);
        });

        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES ${ingredientValues}`,
          ingredientParams,
        );
      }

      // Insert nutritional info
      if (nutrition && Object.keys(nutrition).length > 0) {
        const nutritionResult = await client.query(
          `INSERT INTO recipe_nutrition (recipe_id, calories, protein, carbs, fat, fiber) 
                    VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newRecipe.id,
            nutrition.calories,
            nutrition.protein,
            nutrition.carbs,
            nutrition.fat,
            nutrition.fiber,
          ],
        );
      }

      await client.query("COMMIT");

      // fetch the complete recipe with ingredients and nutrition info to return
      return await this.findById(newRecipe.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  //  get all recipes by ID with nutritional info and ingredients
  static async findById(recipeId, userId) {
    const recipeResult = await db.query(
      `SELECT * FROM recipes WHERE id = $1 AND user_id = $2`,
      [recipeId, userId],
    );
    if (recipeResult.rows.length === 0) return null;

    const recipe = recipeResult.rows[0];

    // get ingredients
    const ingredientsResult = await db.query(
      `SELECT ingredient_name, quantity, unit FROM recipe_ingredients WHERE recipe_id = $1`,
      [recipeId],
    );

    // get nutritional info
    const nutritionResult = await db.query(
      `SELECT calories, protein, carbs, fat, fiber FROM recipe_nutrition WHERE recipe_id = $1`,
      [recipeId],
    );

    return {
      ...recipe,
      nutrition: nutritionResult.rows[0] || null,
      ingredients: ingredientsResult.rows,
    };
  }

  //   get all recipes for a user with optional filters
  static async findByUserId(userId, filters = {}) {
    let query =
      "SELECT r.*, rn.calories FROM recipes r LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id WHERE r.user_id = $1";
    const params = [userId];
    let paramIndex = 1;

    if (filters.search) {
      paramIndex++;
      query += ` AND (r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.cuisine_type) {
      paramIndex++;
      query += ` AND r.cuisine_type = $${paramIndex}`;
      params.push(filters.cuisine_type);
    }

    if (filters.difficulty) {
      paramIndex++;
      query += ` AND r.difficulty = $${paramIndex}`;
      params.push(filters.difficulty);
    }

    if (filters.dietary_tags) {
      paramIndex++;
      query += ` AND $${paramIndex} = ANY(r.dietary_tags)`;
      params.push(filters.dietary_tags);
    }

    if (filters.max_cook_time) {
      paramIndex++;
      query += ` AND r.cook_time <= $${paramIndex}`;
      params.push(filters.max_cook_time);
    }

    // sort by creation date
    const sortBy = filters.sort_by || "created_at";
    const sortOrder = filters.sort_order === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY r.${sortBy} ${sortOrder}`;

    // pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    paramIndex++;
    query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  //  get recent recipe
  static async getRecent(userId, limit = 5) {
    const result = await db.query(
      `SELECT r.*, rn.calories FROM recipes r 
      LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id 
      WHERE r.user_id = $1 
      ORDER BY r.created_at DESC 
      LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  //   update recipe by ID
  static async update(recipeId, userId, updates) {
    const {
      name,
      description,
      cuisine_type,
      difficulty,
      prep_time,
      cook_time,
      servings,
      instructions,
      dietary_tags,
      user_notes,
      image_url,
    } = updates;

    const result = await db.query(
      `UPDATE recipes SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            cuisine_type = COALESCE($3, cuisine_type),
            difficulty = COALESCE($4, difficulty),
            prep_time = COALESCE($5, prep_time),
            cook_time = COALESCE($6, cook_time),
            servings = COALESCE($7, servings),
            instructions = COALESCE($8, instructions),
            dietary_tags = COALESCE($9, dietary_tags),
            user_notes = COALESCE($10, user_notes),
            image_url = COALESCE($11, image_url)
            WHERE id = $12 AND user_id = $13
            RETURNING *`,
      [
        name,
        description,
        cuisine_type,
        difficulty,
        prep_time,
        cook_time,
        servings,
        JSON.stringify(instructions),
        dietary_tags,
        user_notes,
        image_url,
        recipeId,
        userId,
      ],
    );
    return result.rows[0] || null;
  }

  //   delete recipe by ID
  static async delete(recipeId, userId) {
    const result = await db.query(
      `DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING *`,
      [recipeId, userId],
    );
    return result.rows[0] || null;
  }

  //   get recipe stats
  static async getStats(userId) {
    const result = await db.query(
      `SELECT 
         COUNT(*) AS total_recipes,
            COUNT(DISTINCT cuisine_type) AS total_type_count,
            AVG(cook_time) AS avg_cook_time
            FROM recipes
            WHERE user_id = $1`,
      [userId],
    );

    return result.rows[0];
  }
}

export default Recipe;
