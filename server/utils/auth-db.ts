import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { normalizeUsername, type BlogUserRole } from "@serverUtils/auth";

const AUTH_DB_PATH = join(process.cwd(), ".data", "auth.sqlite");

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  role: BlogUserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  role: BlogUserRole;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

let database: any = null;
let seedChecked = false;

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: String(row.id),
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function getDatabase() {
  if (database) return database;

  mkdirSync(dirname(AUTH_DB_PATH), { recursive: true });
  database = new Database(AUTH_DB_PATH);
  database.pragma("journal_mode = WAL");
  ensureLocalUsersTable(database);

  return database;
}

function ensureLocalUsersTable(db: any) {
  const tableRow = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get() as { name?: string } | undefined;

  if (tableRow?.name) {
    const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const names = new Set(columns.map((item) => item.name));
    const isLocalSchema = names.has("username") && names.has("display_name") && names.has("password_hash");

    if (!isLocalSchema) {
      const legacyTable = `users_legacy_${Date.now()}`;
      db.exec(`ALTER TABLE users RENAME TO ${legacyTable}`);
      console.warn(`[auth] Detected legacy users table. Renamed to ${legacyTable} and created local auth schema.`);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getSeedCredentials() {
  const config = useRuntimeConfig();
  const username = normalizeUsername(String(config.authSeedAdminUsername || ""));
  const password = String(config.authSeedAdminPassword || "");
  return { username, password };
}

export async function ensureSeedAdminUser() {
  if (seedChecked) return;

  const db = getDatabase();
  const countRow = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (countRow.count > 0) {
    seedChecked = true;
    return;
  }

  const { username, password } = getSeedCredentials();
  if (!username || !password) {
    seedChecked = true;
    return;
  }

  const passwordHash = await hashPassword(password);
  db.prepare(
    `
    INSERT INTO users (username, display_name, role, password_hash)
    VALUES (@username, @displayName, 'admin', @passwordHash)
  `,
  ).run({
    username,
    displayName: username,
    passwordHash,
  });

  seedChecked = true;
}

export async function authenticateLocalUser(usernameInput: string, password: string): Promise<UserRecord | null> {
  await ensureSeedAdminUser();
  const username = normalizeUsername(usernameInput);
  if (!username || !password) return null;

  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;

  if (!row) return null;
  const isValid = await verifyPassword(row.password_hash, password);
  if (!isValid) return null;

  db.prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(row.id);
  const updatedRow = db.prepare("SELECT * FROM users WHERE id = ?").get(row.id) as UserRow;
  return toUserRecord(updatedRow);
}

export async function listUsers(): Promise<UserRecord[]> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const rows = db
    .prepare("SELECT * FROM users ORDER BY (role = 'admin') DESC, last_login_at DESC")
    .all() as UserRow[];
  return rows.map(toUserRecord);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(numericId) as UserRow | undefined;
  return row ? toUserRecord(row) : null;
}
