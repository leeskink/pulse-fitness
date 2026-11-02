
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import pg from "pg";
import Stripe from "stripe";

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, ".env") });

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  throw new Error("DATABASE_URL and SESSION_SECRET are required in server/.env");
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required in server/.env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error.message);
});

app.set("trust proxy", 1);

// Stripe webhook must be registered before express.json().
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Stripe webhook signature error:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const checkout = event.data.object;

        if (checkout.payment_status === "paid") {
          await pool.query(
            `UPDATE orders
             SET status = 'paid', paid_at = NOW()
             WHERE stripe_checkout_session_id = $1`,
            [checkout.id]
          );
        }
      }

      if (event.type === "checkout.session.expired") {
        const checkout = event.data.object;

        await pool.query(
          `UPDATE orders
           SET status = 'cancelled'
           WHERE stripe_checkout_session_id = $1
           AND status = 'pending'`,
          [checkout.id]
        );
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing failed." });
    }
  }
);

app.use(express.json({ limit: "12mb" }));

app.use(cors({
  origin: (
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5180,http://localhost:5181,http://localhost:5182,http://localhost:5173,http://localhost:5174"
  ).split(",").map((value) => value.trim()),
  credentials: true,
}));

const PgStore = connectPgSimple(session);

app.use(session({
  store: new PgStore({
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
    maxAge: 604800000,
  },
}));

const run = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const safeUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  role: user.role,
});

const saveSession = (req) =>
  new Promise((resolve, reject) =>
    req.session.save((error) => error ? reject(error) : resolve())
  );

const regenerate = (req) =>
  new Promise((resolve, reject) =>
    req.session.regenerate((error) => error ? reject(error) : resolve())
  );

// DATABASE INITIALIZATION
async function initDb() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS trainers (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      specialty TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      photo_data TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trainer_availability (
      id BIGSERIAL PRIMARY KEY,
      trainer_id BIGINT REFERENCES trainers(id) ON DELETE CASCADE,
      day_of_week SMALLINT NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      CHECK(end_time > start_time)
    );

    CREATE TABLE IF NOT EXISTS member_profiles (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      goals TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS member_training_preferences (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferred_trainer_id BIGINT REFERENCES trainers(id) ON DELETE SET NULL,
      preferred_days SMALLINT[] NOT NULL DEFAULT '{}',
      preferred_time TEXT NOT NULL DEFAULT 'flexible',
      training_goal TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS training_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      trainer_id BIGINT REFERENCES trainers(id) ON DELETE RESTRICT,
      session_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK(status IN ('scheduled','completed','cancelled')),
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CHECK(end_time > start_time)
    );

    ALTER TABLE training_sessions
      ADD COLUMN IF NOT EXISTS program_name TEXT NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS programme_requests (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trainer_id BIGINT NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
      program_name TEXT NOT NULL,
      requested_date DATE NOT NULL,
      requested_start_time TIME NOT NULL,
      requested_end_time TIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'declined', 'rescheduled')),
      admin_note TEXT NOT NULL DEFAULT '',
      session_id BIGINT REFERENCES training_sessions(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (requested_end_time > requested_start_time)
    );

    CREATE INDEX IF NOT EXISTS programme_requests_member_idx
      ON programme_requests(user_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS programme_requests_status_idx
      ON programme_requests(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS membership_plans (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price NUMERIC(10,2) NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 30,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      discount_percent NUMERIC(5,2) NOT NULL,
      starts_at DATE,
      ends_at DATE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      membership_plan_id BIGINT NOT NULL REFERENCES membership_plans(id),
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'aed',
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_checkout_session_id TEXT UNIQUE,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS training_sessions_member_date_idx
      ON training_sessions(user_id, session_date);

    CREATE INDEX IF NOT EXISTS training_sessions_trainer_date_idx
      ON training_sessions(trainer_id, session_date);

    CREATE INDEX IF NOT EXISTS orders_user_date_idx
      ON orders(user_id, created_at DESC);
  `);

  // Keep the three website membership plans synchronized with PostgreSQL.
  const defaultPlans = [
    {
      name: "Starter",
      description: "A flexible starting point for your fitness journey.",
      price: 199,
    },
    {
      name: "Performance",
      description: "For members ready to take their training further.",
      price: 349,
    },
    {
      name: "Elite",
      description: "A premium experience with more personalized support.",
      price: 599,
    },
  ];

  for (const plan of defaultPlans) {
    const existing = await pool.query(
      `SELECT id FROM membership_plans
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [plan.name]
    );

    if (existing.rowCount) {
      await pool.query(
        `UPDATE membership_plans
         SET description = $1,
             price = $2,
             duration_days = 30,
             active = TRUE
         WHERE id = $3`,
        [plan.description, plan.price, existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO membership_plans
          (name, description, price, duration_days, active)
         VALUES ($1, $2, $3, 30, TRUE)`,
        [plan.name, plan.description, plan.price]
      );
    }
  }
}

// AUTHENTICATION HELPERS
async function sessionUser(req) {
  if (!req.session?.userId) return null;

  const result = await pool.query(
    "SELECT id, full_name, email, role FROM users WHERE id = $1",
    [req.session.userId]
  );

  return result.rows[0] || null;
}

const auth = run(async (req, res, next) => {
  req.user = await sessionUser(req);

  if (!req.user) {
    return res.status(401).json({ message: "Please log in." });
  }

  next();
});

const member = run(async (req, res, next) => {
  req.user = await sessionUser(req);

  if (!req.user) {
    return res.status(401).json({ message: "Please log in." });
  }

  if (req.user.role !== "member") {
    return res.status(403).json({ message: "Member access only." });
  }

  next();
});

const admin = run(async (req, res, next) => {
  req.user = await sessionUser(req);

  if (!req.user) {
    return res.status(401).json({ message: "Please log in." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Administrator access required.",
    });
  }

  next();
});

// GENERAL ROUTES
app.get("/", (_req, res) => {
  res.json({ message: "Pulse Fitness API running" });
});

app.get("/api/health", run(async (_req, res) => {
  const result = await pool.query("SELECT NOW() AS time");

  res.json({
    status: "ok",
    database: "connected",
    time: result.rows[0].time,
  });
}));

// AUTH ROUTES
app.post("/api/auth/register", run(async (req, res) => {
  const { fullName, email, password } = req.body || {};

  if (
    !fullName?.trim?.() ||
    !email?.trim?.() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      message: "Name, email and password (at least 8 characters) are required.",
    });
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users(full_name, email, password_hash, role)
     VALUES($1, $2, $3, 'member')
     RETURNING id, full_name, email, role`,
    [fullName.trim(), email.trim().toLowerCase(), hash]
  );

  await regenerate(req);
  req.session.userId = result.rows[0].id;
  await saveSession(req);

  res.status(201).json({
    user: safeUser(result.rows[0]),
    message: "Account created.",
  });
}));

app.post("/api/auth/login", run(async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  const result = await pool.query(
    `SELECT id, full_name, email, password_hash, role
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );

  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({
      message: "Invalid email or password.",
    });
  }

  await regenerate(req);
  req.session.userId = user.id;
  await saveSession(req);

  res.json({
    user: safeUser(user),
    message: "Login successful.",
  });
}));

app.get("/api/auth/me", auth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("pulse.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Logged out." });
  });
});

// MEMBERSHIP AND STRIPE CHECKOUT
app.get("/api/membership-plans", run(async (_req, res) => {
  const result = await pool.query(
    `SELECT id, name, description, price, duration_days
     FROM membership_plans
     WHERE active = TRUE
     ORDER BY price ASC`
  );

  res.json({ plans: result.rows });
}));

app.post("/api/checkout/create-session", auth, run(async (req, res) => {
  const { planName } = req.body || {};

  if (!["Starter", "Performance", "Elite"].includes(planName)) {
    return res.status(400).json({
      message: "Please select a valid membership plan.",
    });
  }

  const planResult = await pool.query(
    `SELECT id, name, description, price
     FROM membership_plans
     WHERE LOWER(name) = LOWER($1)
       AND active = TRUE
     LIMIT 1`,
    [planName]
  );

  if (!planResult.rowCount) {
    return res.status(404).json({
      message: "This membership plan is not available in the database.",
    });
  }

  const plan = planResult.rows[0];
  const amountCents = Math.round(Number(plan.price) * 100);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return res.status(400).json({
      message: "Invalid membership price.",
    });
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const orderResult = await pool.query(
    `INSERT INTO orders
      (user_id, membership_plan_id, amount_cents, currency, status)
     VALUES ($1, $2, $3, 'aed', 'pending')
     RETURNING id`,
    [req.user.id, plan.id, amountCents]
  );

  const orderId = orderResult.rows[0].id;

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `Pulse Fitness - ${plan.name} Membership`,
              description: plan.description || "Monthly gym membership",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: String(orderId),
        userId: String(req.user.id),
        planId: String(plan.id),
      },
      success_url:
        `${clientUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/?payment=cancelled`,
    });

    await pool.query(
      `UPDATE orders
       SET stripe_checkout_session_id = $1
       WHERE id = $2`,
      [checkout.id, orderId]
    );

    res.json({ url: checkout.url });
  } catch (error) {
    await pool.query(
      "UPDATE orders SET status = 'failed' WHERE id = $1",
      [orderId]
    );

    throw error;
  }
}));

// MEMBER API
app.get("/api/member/trainers", member, run(async (_req, res) => {
  const result = await pool.query(`
    SELECT
      t.id,
      t.full_name,
      t.specialty,
      t.bio,
      t.photo_data,
      COALESCE(
        json_agg(
          json_build_object(
            'dayOfWeek', a.day_of_week,
            'startTime', a.start_time,
            'endTime', a.end_time
          )
          ORDER BY a.day_of_week, a.start_time
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
      ) availability
    FROM trainers t
    LEFT JOIN trainer_availability a ON a.trainer_id = t.id
    WHERE t.active = TRUE
    GROUP BY t.id
    ORDER BY t.full_name
  `);

  res.json({ trainers: result.rows });
}));

app.get("/api/member/preferences", member, run(async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, t.full_name preferred_trainer_name
    FROM member_training_preferences p
    LEFT JOIN trainers t ON t.id = p.preferred_trainer_id
    WHERE p.user_id = $1
  `, [req.user.id]);

  res.json({ preferences: result.rows[0] || null });
}));

app.put("/api/member/preferences", member, run(async (req, res) => {
  const {
    preferredTrainerId = null,
    preferredDays = [],
    preferredTime = "flexible",
    trainingGoal = "",
  } = req.body || {};

  if (
    !Array.isArray(preferredDays) ||
    !preferredDays.length ||
    preferredDays.some(
      (day) =>
        !Number.isInteger(Number(day)) ||
        Number(day) < 0 ||
        Number(day) > 6
    )
  ) {
    return res.status(400).json({
      message: "Choose at least one valid preferred training day.",
    });
  }

  if (!["morning", "afternoon", "evening", "flexible"].includes(preferredTime)) {
    return res.status(400).json({
      message: "Choose a valid preferred time.",
    });
  }

  if (preferredTrainerId) {
    const check = await pool.query(
      "SELECT id FROM trainers WHERE id = $1 AND active = TRUE",
      [preferredTrainerId]
    );

    if (!check.rowCount) {
      return res.status(400).json({
        message: "That trainer is no longer available.",
      });
    }
  }

  const result = await pool.query(`
    INSERT INTO member_training_preferences
      (user_id, preferred_trainer_id, preferred_days, preferred_time, training_goal, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT(user_id) DO UPDATE SET
      preferred_trainer_id = EXCLUDED.preferred_trainer_id,
      preferred_days = EXCLUDED.preferred_days,
      preferred_time = EXCLUDED.preferred_time,
      training_goal = EXCLUDED.training_goal,
      updated_at = NOW()
    RETURNING *
  `, [
    req.user.id,
    preferredTrainerId || null,
    preferredDays.map(Number),
    preferredTime,
    String(trainingGoal).trim(),
  ]);

  res.json({
    preferences: result.rows[0],
    message: "Your training preferences have been saved.",
  });
}));

app.get("/api/member/sessions", member, run(async (req, res) => {
  const result = await pool.query(`
    SELECT
      s.id,
      s.session_date,
      s.start_time,
      s.end_time,
      s.status,
      s.notes,
      s.program_name,
      t.full_name trainer_name,
      t.specialty trainer_specialty,
      t.photo_data trainer_photo
    FROM training_sessions s
    JOIN trainers t ON t.id = s.trainer_id
    WHERE s.user_id = $1
    ORDER BY s.session_date, s.start_time
  `, [req.user.id]);

  res.json({ sessions: result.rows });
}));

// MEMBER PROGRAMME REQUESTS
app.get("/api/member/requests", member, run(async (req, res) => {
  const result = await pool.query(`
    SELECT r.*, t.full_name AS trainer_name,
           t.specialty AS trainer_specialty,
           s.session_date, s.start_time, s.end_time,
           s.status AS session_status
    FROM programme_requests r
    JOIN trainers t ON t.id = r.trainer_id
    LEFT JOIN training_sessions s ON s.id = r.session_id
    WHERE r.user_id = $1
    ORDER BY r.created_at DESC
  `, [req.user.id]);

  res.json({ requests: result.rows });
}));

app.post("/api/member/requests", member, run(async (req, res) => {
  const {
    trainerId,
    programName,
    requestedDate,
    sessionDate,
    startTime,
    endTime,
  } = req.body || {};

  const date = requestedDate || sessionDate;
  const name = String(programName || "").trim();

  if (!trainerId || !name || !date || !startTime || !endTime || endTime <= startTime) {
    return res.status(400).json({
      message: "Choose a programme, trainer, date and valid start/end times.",
    });
  }

  if (new Date(`${date}T${startTime}`) <= new Date()) {
    return res.status(400).json({
      message: "Please choose a future date and time.",
    });
  }

  const trainer = await pool.query(
    "SELECT id FROM trainers WHERE id = $1 AND active = TRUE",
    [trainerId]
  );

  if (!trainer.rowCount) {
    return res.status(404).json({
      message: "Trainer not found or unavailable.",
    });
  }

  const availability = await pool.query(`
    SELECT 1
    FROM trainer_availability
    WHERE trainer_id = $1
      AND day_of_week = EXTRACT(DOW FROM $2::date)::int
      AND start_time <= $3::time
      AND end_time >= $4::time
    LIMIT 1
  `, [trainerId, date, startTime, endTime]);

  if (!availability.rowCount) {
    return res.status(409).json({
      message: "The trainer is not available on that day and time.",
    });
  }

  const conflict = await pool.query(`
    SELECT 1
    FROM training_sessions
    WHERE status = 'scheduled'
      AND session_date = $2
      AND (trainer_id = $1 OR user_id = $3)
      AND start_time < $5::time
      AND end_time > $4::time
    LIMIT 1
  `, [trainerId, date, req.user.id, startTime, endTime]);

  if (conflict.rowCount) {
    return res.status(409).json({
      message: "The trainer or you already have a session at that time.",
    });
  }

  const result = await pool.query(`
    INSERT INTO programme_requests
      (user_id, trainer_id, program_name, requested_date, requested_start_time, requested_end_time)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [req.user.id, trainerId, name, date, startTime, endTime]);

  res.status(201).json({
    request: result.rows[0],
    message: "Programme request submitted for approval.",
  });
}));

// ADMIN API
app.post("/api/admin/admins", admin, run(async (req, res) => {
  const { fullName, email, password } = req.body || {};

  if (
    !fullName?.trim?.() ||
    !email?.trim?.() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      message: "Enter name, email and password (minimum 8 characters).",
    });
  }

  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users(full_name, email, password_hash, role)
     VALUES($1, $2, $3, 'admin')
     RETURNING id, full_name, email, role`,
    [fullName.trim(), email.trim().toLowerCase(), hash]
  );

  res.status(201).json({ admin: safeUser(result.rows[0]) });
}));

app.get("/api/admin/overview", admin, run(async (_req, res) => {
  const [users, members, trainers, sessions, plans] = await Promise.all([
    pool.query("SELECT COUNT(*)::int n FROM users"),
    pool.query("SELECT COUNT(*)::int n FROM users WHERE role = 'member'"),
    pool.query("SELECT COUNT(*)::int n FROM trainers WHERE active"),
    pool.query(
      `SELECT COUNT(*)::int n
       FROM training_sessions
       WHERE status = 'scheduled' AND session_date >= CURRENT_DATE`
    ),
    pool.query("SELECT COUNT(*)::int n FROM membership_plans WHERE active"),
  ]);

  res.json({
    totalUsers: users.rows[0].n,
    totalMembers: members.rows[0].n,
    totalTrainers: trainers.rows[0].n,
    upcomingSessions: sessions.rows[0].n,
    activePlans: plans.rows[0].n,
  });
}));

app.get("/api/admin/users", admin, run(async (_req, res) => {
  const result = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.created_at,
      COALESCE(mp.goals, '') goals,
      COALESCE(mp.notes, '') notes,
      pref.preferred_trainer_id,
      COALESCE(t.full_name, '') preferred_trainer_name,
      COALESCE(pref.preferred_days, '{}') preferred_days,
      COALESCE(pref.preferred_time, 'flexible') preferred_time,
      COALESCE(pref.training_goal, '') training_goal
    FROM users u
    LEFT JOIN member_profiles mp ON mp.user_id = u.id
    LEFT JOIN member_training_preferences pref ON pref.user_id = u.id
    LEFT JOIN trainers t ON t.id = pref.preferred_trainer_id
    ORDER BY u.created_at DESC
  `);

  res.json({ users: result.rows });
}));

app.put("/api/admin/users/:id", admin, run(async (req, res) => {
  const { goals = "", notes = "" } = req.body || {};

  await pool.query(`
    INSERT INTO member_profiles(user_id, goals, notes)
    VALUES($1, $2, $3)
    ON CONFLICT(user_id) DO UPDATE SET
      goals = EXCLUDED.goals,
      notes = EXCLUDED.notes,
      updated_at = NOW()
  `, [Number(req.params.id), String(goals), String(notes)]);

  res.json({ message: "Member profile updated." });
}));

app.delete("/api/admin/users/:id", admin, run(async (req, res) => {
  const id = Number(req.params.id);

  if (id === Number(req.user.id)) {
    return res.status(400).json({
      message: "You cannot delete your own account.",
    });
  }

  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 AND role = 'member' RETURNING id",
    [id]
  );

  if (!result.rowCount) {
    return res.status(404).json({
      message: "Member not found. Admin accounts are protected.",
    });
  }

  res.json({ message: "Member deleted." });
}));

app.get("/api/admin/trainers", admin, run(async (_req, res) => {
  const result = await pool.query(`
    SELECT
      t.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'dayOfWeek', a.day_of_week,
            'startTime', a.start_time,
            'endTime', a.end_time
          )
          ORDER BY a.day_of_week, a.start_time
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
      ) availability
    FROM trainers t
    LEFT JOIN trainer_availability a ON a.trainer_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `);

  res.json({ trainers: result.rows });
}));

app.post("/api/admin/trainers", admin, run(async (req, res) => {
  const {
    fullName,
    specialty = "",
    bio = "",
    email = "",
    phone = "",
    photoData = null,
    availability = [],
  } = req.body || {};

  if (!fullName?.trim?.()) {
    return res.status(400).json({
      message: "Trainer name is required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const inserted = await client.query(
      `INSERT INTO trainers
        (full_name, specialty, bio, email, phone, photo_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [fullName.trim(), specialty, bio, email, phone, photoData]
    );

    for (const slot of availability) {
      await client.query(
        `INSERT INTO trainer_availability
          (trainer_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [
          inserted.rows[0].id,
          Number(slot.dayOfWeek),
          slot.startTime,
          slot.endTime,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ trainer: inserted.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.put("/api/admin/trainers/:id", admin, run(async (req, res) => {
  const {
    fullName,
    specialty = "",
    bio = "",
    email = "",
    phone = "",
    photoData = null,
    active = true,
    availability = [],
  } = req.body || {};

  const id = Number(req.params.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await client.query(`
      UPDATE trainers
      SET full_name = $1,
          specialty = $2,
          bio = $3,
          email = $4,
          phone = $5,
          photo_data = COALESCE($6, photo_data),
          active = $7
      WHERE id = $8
      RETURNING *
    `, [
      fullName,
      specialty,
      bio,
      email,
      phone,
      photoData,
      Boolean(active),
      id,
    ]);

    if (!updated.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Trainer not found." });
    }

    await client.query(
      "DELETE FROM trainer_availability WHERE trainer_id = $1",
      [id]
    );

    for (const slot of availability) {
      await client.query(
        `INSERT INTO trainer_availability
          (trainer_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)`,
        [id, Number(slot.dayOfWeek), slot.startTime, slot.endTime]
      );
    }

    await client.query("COMMIT");
    res.json({ trainer: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.delete("/api/admin/trainers/:id", admin, run(async (req, res) => {
  const result = await pool.query(
    "UPDATE trainers SET active = FALSE WHERE id = $1 RETURNING id",
    [Number(req.params.id)]
  );

  if (!result.rowCount) {
    return res.status(404).json({ message: "Trainer not found." });
  }

  res.json({ message: "Trainer deactivated." });
}));

// ADMIN PROGRAMME REQUESTS
app.get("/api/admin/requests", admin, run(async (_req, res) => {
  const result = await pool.query(`
    SELECT r.*, u.full_name AS member_name, u.email AS member_email,
           t.full_name AS trainer_name, t.specialty AS trainer_specialty
    FROM programme_requests r
    JOIN users u ON u.id = r.user_id
    JOIN trainers t ON t.id = r.trainer_id
    ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC
  `);

  res.json({ requests: result.rows });
}));

app.patch("/api/admin/requests/:id", admin, run(async (req, res) => {
  const {
    status,
    requestedDate,
    sessionDate,
    startTime,
    endTime,
    adminNote = "",
    notes = "",
  } = req.body || {};

  if (!["approved", "declined", "rescheduled"].includes(status)) {
    return res.status(400).json({
      message: "Choose approved, declined or rescheduled.",
    });
  }

  const found = await pool.query(
    "SELECT * FROM programme_requests WHERE id = $1",
    [Number(req.params.id)]
  );

  if (!found.rowCount) {
    return res.status(404).json({
      message: "Programme request not found.",
    });
  }

  const request = found.rows[0];

  if (request.status !== "pending") {
    return res.status(409).json({
      message: "This request has already been reviewed.",
    });
  }

  const finalDate = requestedDate || sessionDate || request.requested_date;
  const finalStart = startTime || request.requested_start_time;
  const finalEnd = endTime || request.requested_end_time;
  const note = String(adminNote || notes).trim();

  if (status !== "declined") {
    if (!finalDate || !finalStart || !finalEnd || finalEnd <= finalStart) {
      return res.status(400).json({
        message: "Choose a valid session date and start/end time.",
      });
    }

    const availability = await pool.query(`
      SELECT 1
      FROM trainer_availability
      WHERE trainer_id = $1
        AND day_of_week = EXTRACT(DOW FROM $2::date)::int
        AND start_time <= $3::time
        AND end_time >= $4::time
      LIMIT 1
    `, [
      request.trainer_id,
      finalDate,
      finalStart,
      finalEnd,
    ]);

    if (!availability.rowCount) {
      return res.status(409).json({
        message: "The trainer is not available on that day and time.",
      });
    }

    const conflict = await pool.query(`
      SELECT 1
      FROM training_sessions
      WHERE status = 'scheduled'
        AND session_date = $2
        AND (trainer_id = $1 OR user_id = $3)
        AND start_time < $5::time
        AND end_time > $4::time
      LIMIT 1
    `, [
      request.trainer_id,
      finalDate,
      request.user_id,
      finalStart,
      finalEnd,
    ]);

    if (conflict.rowCount) {
      return res.status(409).json({
        message: "The trainer or member already has a session at that time.",
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let sessionId = request.session_id;

    if (status === "declined") {
      if (sessionId) {
        await client.query(
          "UPDATE training_sessions SET status = 'cancelled' WHERE id = $1",
          [sessionId]
        );
      }

      sessionId = null;
    } else {
      const session = await client.query(`
        INSERT INTO training_sessions
          (user_id, trainer_id, session_date, start_time, end_time,
           status, notes, program_name)
        VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
        RETURNING id
      `, [
        request.user_id,
        request.trainer_id,
        finalDate,
        finalStart,
        finalEnd,
        note,
        request.program_name,
      ]);

      sessionId = session.rows[0].id;
    }

    const updated = await client.query(`
      UPDATE programme_requests
      SET status = $1,
          requested_date = $2,
          requested_start_time = $3,
          requested_end_time = $4,
          admin_note = $5,
          session_id = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [
      status,
      finalDate,
      finalStart,
      finalEnd,
      note,
      sessionId,
      request.id,
    ]);

    await client.query("COMMIT");

    res.json({
      request: updated.rows[0],
      message:
        status === "declined"
          ? "Programme request declined."
          : status === "rescheduled"
            ? "Programme request rescheduled."
            : "Programme request approved.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

// ADMIN TRAINING SESSIONS
app.get("/api/admin/sessions", admin, run(async (_req, res) => {
  const result = await pool.query(`
    SELECT
      s.*,
      u.full_name member_name,
      t.full_name trainer_name
    FROM training_sessions s
    JOIN users u ON u.id = s.user_id
    JOIN trainers t ON t.id = s.trainer_id
    ORDER BY s.session_date DESC, s.start_time
  `);

  res.json({ sessions: result.rows });
}));

app.post("/api/admin/sessions", admin, run(async (req, res) => {
  const {
    userId,
    trainerId,
    sessionDate,
    startTime,
    endTime,
    notes = "",
    programName = "",
  } = req.body || {};

  if (
    !userId ||
    !trainerId ||
    !sessionDate ||
    !startTime ||
    !endTime ||
    endTime <= startTime
  ) {
    return res.status(400).json({
      message: "Select a member, trainer, date and valid start/end times.",
    });
  }

  const [userCheck, trainerCheck] = await Promise.all([
    pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'member'",
      [userId]
    ),
    pool.query(
      "SELECT id FROM trainers WHERE id = $1 AND active = TRUE",
      [trainerId]
    ),
  ]);

  if (!userCheck.rowCount || !trainerCheck.rowCount) {
    return res.status(400).json({
      message: "Choose an active trainer and a member.",
    });
  }

  const availability = await pool.query(`
    SELECT 1
    FROM trainer_availability
    WHERE trainer_id = $1
      AND day_of_week = EXTRACT(DOW FROM $2::date)::int
      AND start_time <= $3::time
      AND end_time >= $4::time
    LIMIT 1
  `, [trainerId, sessionDate, startTime, endTime]);

  if (!availability.rowCount) {
    return res.status(409).json({
      message: "Trainer is not available for that day and time.",
    });
  }

  const conflict = await pool.query(`
    SELECT 1
    FROM training_sessions
    WHERE status = 'scheduled'
      AND session_date = $2
      AND (trainer_id = $1 OR user_id = $3)
      AND start_time < $5::time
      AND end_time > $4::time
    LIMIT 1
  `, [trainerId, sessionDate, userId, startTime, endTime]);

  if (conflict.rowCount) {
    return res.status(409).json({
      message: "Trainer or member already has a session at that time.",
    });
  }

  const result = await pool.query(`
    INSERT INTO training_sessions
      (user_id, trainer_id, session_date, start_time, end_time, notes, program_name)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [userId, trainerId, sessionDate, startTime, endTime, notes, programName]);

  res.status(201).json({ session: result.rows[0] });
}));

app.patch("/api/admin/sessions/:id", admin, run(async (req, res) => {
  const { status } = req.body || {};

  if (!["scheduled", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({
      message: "Invalid session status.",
    });
  }

  const result = await pool.query(
    `UPDATE training_sessions
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, Number(req.params.id)]
  );

  if (!result.rowCount) {
    return res.status(404).json({ message: "Session not found." });
  }

  res.json({ session: result.rows[0] });
}));

// MEMBERSHIP PLANS AND PROMOTIONS
app.get("/api/admin/plans", admin, run(async (_req, res) => {
  const [plans, promotions] = await Promise.all([
    pool.query("SELECT * FROM membership_plans ORDER BY created_at DESC"),
    pool.query("SELECT * FROM promotions ORDER BY created_at DESC"),
  ]);

  res.json({
    plans: plans.rows,
    promotions: promotions.rows,
  });
}));

app.post("/api/admin/plans", admin, run(async (req, res) => {
  const {
    name,
    description = "",
    price,
    durationDays = 30,
  } = req.body || {};

  if (
    !name?.trim?.() ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return res.status(400).json({
      message: "Enter a plan name and valid price.",
    });
  }

  const result = await pool.query(
    `INSERT INTO membership_plans
      (name, description, price, duration_days)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name.trim(), description, Number(price), Number(durationDays)]
  );

  res.status(201).json({ plan: result.rows[0] });
}));

app.delete("/api/admin/plans/:id", admin, run(async (req, res) => {
  await pool.query(
    "UPDATE membership_plans SET active = FALSE WHERE id = $1",
    [Number(req.params.id)]
  );

  res.json({ message: "Plan archived." });
}));

app.post("/api/admin/promotions", admin, run(async (req, res) => {
  const {
    title,
    code,
    discountPercent,
    startsAt = null,
    endsAt = null,
  } = req.body || {};

  if (
    !title?.trim?.() ||
    !code?.trim?.() ||
    !Number.isFinite(Number(discountPercent)) ||
    Number(discountPercent) < 0 ||
    Number(discountPercent) > 100
  ) {
    return res.status(400).json({
      message: "Enter title, code and a discount from 0 to 100.",
    });
  }

  const result = await pool.query(
    `INSERT INTO promotions
      (title, code, discount_percent, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      title.trim(),
      code.trim().toUpperCase(),
      Number(discountPercent),
      startsAt,
      endsAt,
    ]
  );

  res.status(201).json({ promotion: result.rows[0] });
}));

app.delete("/api/admin/promotions/:id", admin, run(async (req, res) => {
  await pool.query(
    "UPDATE promotions SET active = FALSE WHERE id = $1",
    [Number(req.params.id)]
  );

  res.json({ message: "Promotion deactivated." });
}));

// ORDER HISTORY
app.get("/api/orders", auth, run(async (req, res) => {
  const result = await pool.query(`
    SELECT
      o.id,
      o.amount_cents,
      o.currency,
      o.status,
      o.paid_at,
      o.created_at,
      p.name AS plan_name
    FROM orders o
    JOIN membership_plans p ON p.id = o.membership_plan_id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
  `, [req.user.id]);

  res.json({ orders: result.rows });
}));

app.get("/api/orders/session/:sessionId", auth, run(async (req, res) => {
  const result = await pool.query(`
    SELECT
      o.id,
      o.amount_cents,
      o.currency,
      o.status,
      o.paid_at,
      p.name AS plan_name
    FROM orders o
    JOIN membership_plans p ON p.id = o.membership_plan_id
    WHERE o.stripe_checkout_session_id = $1
      AND o.user_id = $2
    LIMIT 1
  `, [req.params.sessionId, req.user.id]);

  if (!result.rowCount) {
    return res.status(404).json({ message: "Order not found." });
  }

  res.json({ order: result.rows[0] });
}));

// ERROR HANDLER
app.use((error, _req, res, _next) => {
  console.error("API error:", error);

  if (error.code === "23505") {
    return res.status(409).json({
      message: "That email or promotion code already exists.",
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      message: "This record is linked to other data and cannot be deleted.",
    });
  }

  res.status(500).json({
    message: "Server error. Check the backend terminal for details.",
  });
});

// START SERVER
initDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Pulse Fitness API running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
