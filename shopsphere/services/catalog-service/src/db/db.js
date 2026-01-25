import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "catalogdb",
  user: process.env.DB_USER || "cataloguser",
  password: process.env.DB_PASSWORD || "catalogpass",
});

export async function query(text, params) {
  return pool.query(text, params);
}
