import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "orderdb",
  user: process.env.DB_USER || "orderuser",
  password: process.env.DB_PASSWORD || "orderpass",
});

export async function query(text, params) {
  return pool.query(text, params);
}
