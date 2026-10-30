import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  throw new Error("DATABASE_URL and SESSION_SECRET are required in server/.env");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
pool.on("error", (err) => console.error("PostgreSQL pool error:", err.message));

app.set("trust proxy", 1);
app.use(express.json({ limit: "12mb" }));
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || "http://localhost:5180,http://localhost:5173,http://localhost:5174")
    .split(",").map((x) => x.trim()),
  credentials: true,
}));
const PgStore = connectPgSimple(session);
app.use(session({
  store: new PgStore({ pool, tableName: "user_sessions", createTableIfMissing: false }),
  name: "pulse.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800000 },
}));

const run = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const safeUser = (u) => ({ id: u.id, fullName: u.full_name, email: u.email, role: u.role });

async function initDb() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    CREATE TABLE IF NOT EXISTS trainers (
      id BIGSERIAL PRIMARY KEY, full_name TEXT NOT NULL, specialty TEXT DEFAULT '',
      bio TEXT DEFAULT '', email TEXT DEFAULT '', phone TEXT DEFAULT '',
      photo_data TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trainer_availability (
      id BIGSERIAL PRIMARY KEY, trainer_id BIGINT REFERENCES trainers(id) ON DELETE CASCADE,
      day_of_week SMALLINT NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      start_time TIME NOT NULL, end_time TIME NOT NULL
    );
    CREATE TABLE IF NOT EXISTS member_profiles (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      goals TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS training_sessions (
      id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      trainer_id BIGINT REFERENCES trainers(id) ON DELETE CASCADE,
      session_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS membership_plans (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      price NUMERIC(10,2) NOT NULL, duration_days INTEGER NOT NULL DEFAULT 30,
      active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS promotions (
      id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, code TEXT NOT NULL UNIQUE,
      discount_percent NUMERIC(5,2) NOT NULL, starts_at DATE, ends_at DATE,
      active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
async function sessionUser(req) {
  if (!req.session?.userId) return null;
  const r = await pool.query("SELECT id,full_name,email,role FROM users WHERE id=$1", [req.session.userId]);
  return r.rows[0] || null;
}
const auth = run(async (req, res, next) => {
  req.user = await sessionUser(req);
  if (!req.user) return res.status(401).json({ message: "Please log in." });
  next();
});
const admin = run(async (req, res, next) => {
  req.user = await sessionUser(req);
  if (!req.user) return res.status(401).json({ message: "Please log in." });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator access required." });
  next();
});
const saveSession = (req) => new Promise((resolve, reject) => req.session.save((e) => e ? reject(e) : resolve()));
const regenerate = (req) => new Promise((resolve, reject) => req.session.regenerate((e) => e ? reject(e) : resolve()));

app.get("/", (_req, res) => res.json({ message: "Pulse Fitness API running" }));
app.get("/api/health", run(async (_req, res) => {
  const r = await pool.query("SELECT NOW() AS time");
  res.json({ status: "ok", database: "connected", time: r.rows[0].time });
}));

// Public signup creates member accounts only. Admins are provisioned by an existing admin.
app.post("/api/auth/register", run(async (req, res) => {
  const { fullName, email, password } = req.body || {};
  if (!fullName?.trim?.() || !email?.trim?.() || typeof password !== "string" || password.length < 8)
    return res.status(400).json({ message: "Name, email and password (at least 8 characters) are required." });
  const hash = await bcrypt.hash(password, 12);
  const r = await pool.query(
    "INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,'member') RETURNING id,full_name,email,role",
    [fullName.trim(), email.trim().toLowerCase(), hash]
  );
  await regenerate(req); req.session.userId = r.rows[0].id; await saveSession(req);
  res.status(201).json({ user: safeUser(r.rows[0]), message: "Account created." });
}));
app.post("/api/auth/login", run(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Email and password are required." });
  const r = await pool.query("SELECT id,full_name,email,password_hash,role FROM users WHERE LOWER(email)=LOWER($1)", [email.trim()]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash)))
    return res.status(401).json({ message: "Invalid email or password." });
  await regenerate(req); req.session.userId = u.id; await saveSession(req);
  res.json({ user: safeUser(u), message: "Login successful." });
}));
app.get("/api/auth/me", auth, (req, res) => res.json({ user: safeUser(req.user) }));
app.post("/api/auth/logout", (req, res, next) => req.session.destroy((e) => {
  if (e) return next(e);
  res.clearCookie("pulse.sid", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  res.json({ message: "Logged out." });
}));

app.post("/api/admin/admins", admin, run(async (req, res) => {
  const { fullName, email, password } = req.body || {};
  if (!fullName?.trim?.() || !email?.trim?.() || typeof password !== "string" || password.length < 8)
    return res.status(400).json({ message: "Enter name, email and password (minimum 8 characters)." });
  const hash = await bcrypt.hash(password, 12);
  const r = await pool.query(
    "INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,'admin') RETURNING id,full_name,email,role",
    [fullName.trim(), email.trim().toLowerCase(), hash]
  );
  res.status(201).json({ admin: safeUser(r.rows[0]) });
}));

app.get("/api/admin/overview", admin, run(async (_req, res) => {
  const [u,m,t,s,p] = await Promise.all([
    pool.query("SELECT COUNT(*)::int n FROM users"),
    pool.query("SELECT COUNT(*)::int n FROM users WHERE role='member'"),
    pool.query("SELECT COUNT(*)::int n FROM trainers WHERE active"),
    pool.query("SELECT COUNT(*)::int n FROM training_sessions WHERE status='scheduled' AND session_date>=CURRENT_DATE"),
    pool.query("SELECT COUNT(*)::int n FROM membership_plans WHERE active"),
  ]);
  res.json({ totalUsers:u.rows[0].n, totalMembers:m.rows[0].n, totalTrainers:t.rows[0].n, upcomingSessions:s.rows[0].n, activePlans:p.rows[0].n });
}));
app.get("/api/admin/users", admin, run(async (_req,res) => {
  const r=await pool.query(`SELECT u.id,u.full_name,u.email,u.role,u.created_at,COALESCE(mp.goals,'') goals,COALESCE(mp.notes,'') notes
    FROM users u LEFT JOIN member_profiles mp ON mp.user_id=u.id ORDER BY u.created_at DESC`);
  res.json({ users:r.rows });
}));
app.put("/api/admin/users/:id", admin, run(async (req,res) => {
  const {goals="",notes=""}=req.body||{};
  await pool.query(`INSERT INTO member_profiles(user_id,goals,notes) VALUES($1,$2,$3)
    ON CONFLICT(user_id) DO UPDATE SET goals=EXCLUDED.goals,notes=EXCLUDED.notes,updated_at=NOW()`,
    [Number(req.params.id),String(goals),String(notes)]);
  res.json({message:"Member profile updated."});
}));
app.delete("/api/admin/users/:id", admin, run(async (req,res) => {
  const id=Number(req.params.id);
  if(id===Number(req.user.id)) return res.status(400).json({message:"You cannot delete your own account."});
  const r=await pool.query("DELETE FROM users WHERE id=$1 AND role='member' RETURNING id",[id]);
  if(!r.rowCount) return res.status(404).json({message:"Member not found. Admin accounts are protected."});
  res.json({message:"Member deleted."});
}));

app.get("/api/admin/trainers", admin, run(async (_req,res) => {
  const r=await pool.query(`SELECT t.*,COALESCE(json_agg(json_build_object('id',a.id,'dayOfWeek',a.day_of_week,'startTime',a.start_time,'endTime',a.end_time))
    FILTER(WHERE a.id IS NOT NULL),'[]') availability FROM trainers t LEFT JOIN trainer_availability a ON a.trainer_id=t.id
    GROUP BY t.id ORDER BY t.created_at DESC`);
  res.json({trainers:r.rows});
}));
app.post("/api/admin/trainers", admin, run(async (req,res) => {
  const {fullName,specialty="",bio="",email="",phone="",photoData=null,availability=[]}=req.body||{};
  if(!fullName?.trim?.()) return res.status(400).json({message:"Trainer name is required."});
  const c=await pool.connect();
  try {
    await c.query("BEGIN");
    const r=await c.query("INSERT INTO trainers(full_name,specialty,bio,email,phone,photo_data) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [fullName.trim(),specialty,bio,email,phone,photoData]);
    for(const a of availability) await c.query("INSERT INTO trainer_availability(trainer_id,day_of_week,start_time,end_time) VALUES($1,$2,$3,$4)",
      [r.rows[0].id,Number(a.dayOfWeek),a.startTime,a.endTime]);
    await c.query("COMMIT"); res.status(201).json({trainer:r.rows[0]});
  } catch(e){await c.query("ROLLBACK");throw e;} finally{c.release();}
}));
app.put("/api/admin/trainers/:id", admin, run(async (req,res) => {
  const {fullName,specialty="",bio="",email="",phone="",photoData=null,active=true,availability=[]}=req.body||{};
  const id=Number(req.params.id), c=await pool.connect();
  try {
    await c.query("BEGIN");
    const r=await c.query(`UPDATE trainers SET full_name=$1,specialty=$2,bio=$3,email=$4,phone=$5,photo_data=COALESCE($6,photo_data),active=$7
      WHERE id=$8 RETURNING *`,[fullName,specialty,bio,email,phone,photoData,Boolean(active),id]);
    if(!r.rowCount){await c.query("ROLLBACK");return res.status(404).json({message:"Trainer not found."});}
    await c.query("DELETE FROM trainer_availability WHERE trainer_id=$1",[id]);
    for(const a of availability) await c.query("INSERT INTO trainer_availability(trainer_id,day_of_week,start_time,end_time) VALUES($1,$2,$3,$4)",
      [id,Number(a.dayOfWeek),a.startTime,a.endTime]);
    await c.query("COMMIT");res.json({trainer:r.rows[0]});
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
}));
app.delete("/api/admin/trainers/:id", admin, run(async (req,res) => {
  const r=await pool.query("DELETE FROM trainers WHERE id=$1 RETURNING id",[Number(req.params.id)]);
  if(!r.rowCount)return res.status(404).json({message:"Trainer not found."});
  res.json({message:"Trainer deleted."});
}));

app.get("/api/admin/sessions", admin, run(async (_req,res) => {
  const r=await pool.query(`SELECT s.*,u.full_name member_name,t.full_name trainer_name FROM training_sessions s
    JOIN users u ON u.id=s.user_id JOIN trainers t ON t.id=s.trainer_id ORDER BY s.session_date DESC,s.start_time`);
  res.json({sessions:r.rows});
}));
app.post("/api/admin/sessions", admin, run(async (req,res) => {
  const {userId,trainerId,sessionDate,startTime,endTime,notes=""}=req.body||{};
  if(!userId||!trainerId||!sessionDate||!startTime||!endTime||endTime<=startTime)
    return res.status(400).json({message:"Select a member, trainer, date and valid start/end times."});
  const [u,t]=await Promise.all([
    pool.query("SELECT id FROM users WHERE id=$1 AND role='member'",[userId]),
    pool.query("SELECT id FROM trainers WHERE id=$1 AND active=true",[trainerId])
  ]);
  if(!u.rowCount||!t.rowCount)return res.status(400).json({message:"Choose an active trainer and a member."});
  const clash=await pool.query(`SELECT 1 FROM training_sessions WHERE trainer_id=$1 AND session_date=$2 AND status='scheduled'
    AND start_time<$4 AND end_time>$3 LIMIT 1`,[trainerId,sessionDate,startTime,endTime]);
  if(clash.rowCount)return res.status(409).json({message:"Trainer already has a session at that time."});
  const r=await pool.query(`INSERT INTO training_sessions(user_id,trainer_id,session_date,start_time,end_time,notes)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[userId,trainerId,sessionDate,startTime,endTime,notes]);
  res.status(201).json({session:r.rows[0]});
}));
app.patch("/api/admin/sessions/:id", admin, run(async (req,res) => {
  const {status}=req.body||{};
  if(!["scheduled","completed","cancelled"].includes(status))return res.status(400).json({message:"Invalid status."});
  const r=await pool.query("UPDATE training_sessions SET status=$1 WHERE id=$2 RETURNING *",[status,Number(req.params.id)]);
  if(!r.rowCount)return res.status(404).json({message:"Session not found."});
  res.json({session:r.rows[0]});
}));

app.get("/api/admin/plans", admin, run(async (_req,res) => {
  const [p,d]=await Promise.all([pool.query("SELECT * FROM membership_plans ORDER BY created_at DESC"),pool.query("SELECT * FROM promotions ORDER BY created_at DESC")]);
  res.json({plans:p.rows,promotions:d.rows});
}));
app.post("/api/admin/plans", admin, run(async (req,res) => {
  const {name,description="",price,durationDays=30}=req.body||{};
  if(!name?.trim?.()||!Number.isFinite(Number(price))||Number(price)<0)return res.status(400).json({message:"Enter a plan name and valid price."});
  const r=await pool.query("INSERT INTO membership_plans(name,description,price,duration_days) VALUES($1,$2,$3,$4) RETURNING *",
    [name.trim(),description,Number(price),Number(durationDays)]);
  res.status(201).json({plan:r.rows[0]});
}));
app.delete("/api/admin/plans/:id", admin, run(async (req,res) => {
  await pool.query("UPDATE membership_plans SET active=false WHERE id=$1",[Number(req.params.id)]);
  res.json({message:"Plan archived."});
}));
app.post("/api/admin/promotions", admin, run(async (req,res) => {
  const {title,code,discountPercent,startsAt=null,endsAt=null}=req.body||{};
  if(!title?.trim?.()||!code?.trim?.()||!Number.isFinite(Number(discountPercent))||Number(discountPercent)<0||Number(discountPercent)>100)
    return res.status(400).json({message:"Enter title, code and a discount from 0 to 100."});
  const r=await pool.query("INSERT INTO promotions(title,code,discount_percent,starts_at,ends_at) VALUES($1,$2,$3,$4,$5) RETURNING *",
    [title.trim(),code.trim().toUpperCase(),Number(discountPercent),startsAt,endsAt]);
  res.status(201).json({promotion:r.rows[0]});
}));
app.delete("/api/admin/promotions/:id", admin, run(async (req,res) => {
  await pool.query("UPDATE promotions SET active=false WHERE id=$1",[Number(req.params.id)]);
  res.json({message:"Promotion deactivated."});
}));

app.use((err,_req,res,_next)=>{
  console.error("API error:",err);
  if(err.code==="23505")return res.status(409).json({message:"That email or promotion code already exists."});
  if(err.code==="23503")return res.status(400).json({message:"This record is linked to other data and cannot be deleted."});
  res.status(500).json({message:"Server error. Check the backend terminal for details."});
});

initDb().then(()=>app.listen(PORT,()=>console.log(`Pulse Fitness API running on port ${PORT}`)))
  .catch((e)=>{console.error("Database initialization failed:",e);process.exit(1);});
