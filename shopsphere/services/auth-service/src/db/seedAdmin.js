import bcrypt from "bcrypt";
import { query } from "./db.js";

export async function seedAdmin() {
  const adminEmail = "admin@shop.com";
  const adminPassword = "Admin123!"; // you can change, but keep it documented
  const adminName = "Admin";

  const exists = await query(`SELECT id FROM users WHERE email=$1`, [adminEmail]);
  if (exists.rowCount > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,'admin')`,
    [adminName, adminEmail, passwordHash]
  );

  console.log(" Seeded admin user:", adminEmail, "password:", adminPassword);
}
