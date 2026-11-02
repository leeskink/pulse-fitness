import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const result = await pool.query(
    "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, full_name, email, role",
    ["testmember@example.com"]
  );

  console.log("Account update result:");
  console.log(result.rows);
} catch (error) {
  console.error("Database update failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
