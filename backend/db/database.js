const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const bcrypt  = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, 'bpqg.db'));

function run(sql, params=[]) {
  return new Promise((res,rej)=>db.run(sql,params,function(e){e?rej(e):res({lastInsertRowid:this.lastID,changes:this.changes})}));
}
function get(sql,params=[]){
  return new Promise((res,rej)=>db.get(sql,params,(e,r)=>e?rej(e):res(r)));
}
function all(sql,params=[]){
  return new Promise((res,rej)=>db.all(sql,params,(e,r)=>e?rej(e):res(r||[])));
}

async function initDB() {
  await run('PRAGMA journal_mode=WAL');
  await run('PRAGMA foreign_keys=ON');

  // ── CREATE TABLE first (includes all columns) ─────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('client','admin','developer')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    is_approved INTEGER DEFAULT 0,
    approved_by INTEGER,
    FOREIGN KEY (approved_by) REFERENCES users(id)
  )`);

  // ── ALTER TABLE after (safe for existing databases) ───────────────────
  // These silently do nothing if column already exists
  await run(`ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0`).catch(()=>{});
  await run(`ALTER TABLE users ADD COLUMN approved_by INTEGER`).catch(()=>{});

  // ── Auto approve admins and developers ────────────────────────────────
  await run(`UPDATE users SET is_approved = 1 WHERE role IN ('admin', 'developer')`);

  await run(`CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    business_name TEXT NOT NULL, client_name TEXT NOT NULL,
    project_title TEXT NOT NULL, industry TEXT NOT NULL,
    description TEXT NOT NULL, objectives TEXT, scope_of_work TEXT,
    deliverables TEXT, timeline TEXT, budget REAL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT, estimated_cost REAL, admin_timeline TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    tier TEXT NOT NULL,
    title TEXT,
    description TEXT,
    cost REAL NOT NULL,
    gst_amount REAL DEFAULT 0,
    total_cost REAL NOT NULL,
    gst_rate REAL DEFAULT 18,
    timeline TEXT NOT NULL,
    services TEXT,
    benefits TEXT,
    meeting_policy TEXT,
    alter_policy TEXT,
    detected_keywords TEXT,
    admin_note TEXT,
    can_negotiate INTEGER DEFAULT 0,
    can_meet INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS quotation_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL UNIQUE,
    client_id INTEGER NOT NULL,
    tier TEXT NOT NULL,
    quotation_id INTEGER NOT NULL,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (quotation_id) REFERENCES quotations(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    requested_by TEXT DEFAULT 'client',
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    notes TEXT, status TEXT DEFAULT 'pending',
    admin_date TEXT, admin_time TEXT, admin_note TEXT, meeting_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (client_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL UNIQUE,
    developer_id INTEGER NOT NULL,
    deadline TEXT NOT NULL, instructions TEXT,
    status TEXT DEFAULT 'assigned',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id),
    FOREIGN KEY (developer_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    developer_id INTEGER NOT NULL,
    proposal_id INTEGER,
    work_done TEXT NOT NULL, issues_faced TEXT,
    hours_worked REAL NOT NULL,
    report_date DATE DEFAULT (date('now')),
    is_final INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (developer_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME, work_duration REAL, activity_summary TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Ensure the real admin account exists with the correct email
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await get("SELECT id FROM users WHERE email = ? AND role = 'admin'", [ADMIN_EMAIL]);
  if (!existingAdmin) {
    // Remove any old default admin@bpqg.com seed if present
    await run("DELETE FROM users WHERE email = 'admin@bpqg.com' AND role = 'admin'").catch(()=>{});
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await run(
      "INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, 'admin', 1)",
      ['Super Admin', ADMIN_EMAIL, hash]
    );
    console.log(`✅ Admin account created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    // Make sure existing admin is always active and approved
    await run("UPDATE users SET is_active = 1, is_approved = 1 WHERE email = ? AND role = 'admin'", [ADMIN_EMAIL]);
    console.log(`✅ Admin account verified: ${ADMIN_EMAIL}`);
  }
  console.log('✅ DB initialized');
}

module.exports = { db, run, get, all, initDB };