import db from "../config/db.js";
import bcrypt from "bcryptjs";

class User {
  // Create a new user
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
    );
    return result.rows[0];
  }

  // Find a user by email
  static async findByEmail(email) {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }

  // Find User by ID
  static async findById(id) {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  }

  // Update a user's information
  static async update(id, username, email, password) {
    const result = await db.query(
      "UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email) WHERE id = $3 RETURNING id, username, email",
      [username, email, id],
    );
    return result.rows[0];
  }

  // Update a user's password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      id,
    ]);
  }

  // Verify a user's password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Delete a user
  static async delete(id) {
    await db.query("DELETE FROM users WHERE id = $1", [id]);
  }
}

export default User;
