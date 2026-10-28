
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import pg from "pg";

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from server/.env");
}

// PostgreSQL database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error.message);
});

const PgSession = connectPgSimple(session);

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5176",
    ],
    credentials: true,
  })
);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    name: "pulse.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Pulse Fitness API is running" });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// Register a new account
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Name and email are required. Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, role`,
      [fullName.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    req.session.userId = user.id;

    req.session.save((error) => {
      if (error) {
        console.error("Registration session save failed:", error.message);

        return res.status(500).json({
          message:
            "Account created, but the session could not be saved. Please log in.",
        });
      }

      res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration failed:", error.message);

    res.status(500).json({
      message: "Could not register account.",
    });
  }
});

// Log in
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Select role so the frontend can identify administrators.
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Regenerate session after successful authentication.
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration failed:", error.message);

        return res.status(500).json({
          message: "Could not start a login session.",
        });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);

          return res.status(500).json({
            message: "Could not save login session.",
          });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    res.status(500).json({
      message: "Could not log in.",
    });
  }
});

// Check the current login session
app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in.",
      });
    }

    // Look up the account using the ID stored in the session.
    const result = await pool.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    if (!result.rows[0]) {
      return req.session.destroy(() => {
        res.clearCookie("pulse.sid", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        res.status(401).json({
          message: "User account no longer exists.",
        });
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Session check failed:", error.message);

    res.status(500).json({
      message: "Could not check login session.",
    });
  }
});

// Log out
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);

      return res.status(500).json({
        message: "Could not log out.",
      });
    }

    res.clearCookie("pulse.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message: "Logged out successfully.",
    });
  });
});

// Verify that the current session belongs to an administrator.
async function requireAdmin(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Please log in first.",
      });
    }

    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (!result.rows[0]) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (result.rows[0].role !== "admin") {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization failed:", error.message);

    res.status(500).json({
      message: "Could not verify administrator access.",
    });
  }
}

// Admin dashboard overview
app.get("/api/admin/overview", requireAdmin, async (req, res) => {
  try {
    const [usersResult, membersResult, recentUsersResult] =
      await Promise.all([
        pool.query(
          "SELECT COUNT(*)::int AS total FROM users"
        ),
        pool.query(
          "SELECT COUNT(*)::int AS total FROM users WHERE role = 'member'"
        ),
        pool.query(
          `SELECT id, full_name, email, role, created_at
           FROM users
           ORDER BY created_at DESC
           LIMIT 5`
        ),
      ]);

    res.json({
      totalUsers: usersResult.rows[0].total,
      totalMembers: membersResult.rows[0].total,
      recentUsers: recentUsersResult.rows,
    });
  } catch (error) {
    console.error("Admin overview failed:", error.message);

    res.status(500).json({
      message: "Could not load the admin dashboard.",
    });
  }
});

// Start the API server
app.listen(PORT, () => {
  console.log(`Pulse Fitness API running on port ${PORT}`);
});
