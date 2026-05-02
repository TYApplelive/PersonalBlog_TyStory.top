import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { normalizeUsername, type BlogUserRole } from "@serverUtils/auth";

// 从运行时配置获取数据库路径（支持通过 .env 配置）
const config = useRuntimeConfig();
const AUTH_DB_PATH = join(process.cwd(), config.sqliteDbPath || ".data/auth.sqlite");

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  role: BlogUserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  email: string | null;
}

interface UserRow {
  id: number;
  username: string;
  display_name: string;
  role: BlogUserRole;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  email: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
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
    lastLoginAt: row.last_login_at ?? "",
    email: row.email ?? null,
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
  // 清理之前迁移失败可能留下的残留表
  const staleTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'users\\_%' ESCAPE '\\'").all() as Array<{ name: string }>;
  for (const t of staleTables) {
    db.exec(`DROP TABLE IF EXISTS "${t.name}"`);
  }

  const tableRow = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get() as { name?: string } | undefined;

  if (tableRow?.name) {
    const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const existingCols = new Set(columns.map((item) => item.name));
    const hasEmail = existingCols.has("email");

    if (!hasEmail) {
      console.log("[auth] Migrating users table to latest schema...");
      db.exec(`
        CREATE TABLE IF NOT EXISTS users_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_login_at TEXT DEFAULT NULL,
          email TEXT UNIQUE DEFAULT NULL,
          reset_token TEXT DEFAULT NULL,
          reset_token_expires TEXT DEFAULT NULL
        );
        INSERT INTO users_migrated (id, username, display_name, role, password_hash, created_at, updated_at, last_login_at)
        SELECT id, username, display_name, role, password_hash, created_at, updated_at, last_login_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_migrated RENAME TO users;
      `);
      console.log("[auth] Migration complete.");
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
      last_login_at TEXT DEFAULT NULL,
      email TEXT UNIQUE DEFAULT NULL,
      reset_token TEXT DEFAULT NULL,
      reset_token_expires TEXT DEFAULT NULL
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

/**
 * 创建新用户
 * @returns 创建的用户记录
 */
export async function createUser(
  username: string,
  displayName: string,
  password: string,
  role: BlogUserRole = "user",
  email?: string,
): Promise<UserRecord> {
  await ensureSeedAdminUser();
  const normalized = normalizeUsername(username);
  if (!normalized) throw new Error("用户名不能为空");
  if (!password) throw new Error("密码不能为空");

  const db = getDatabase();
  const passwordHash = await hashPassword(password);

  const result = db.prepare(
    `INSERT INTO users (username, display_name, role, password_hash, last_login_at, email)
     VALUES (@username, @displayName, @role, @passwordHash, NULL, @email)`,
  ).run({
    username: normalized,
    displayName: displayName || username,
    role,
    passwordHash,
    email: email || null,
  });

  console.log(`[Auth DB] 创建用户: ${normalized}, 角色: ${role}, ID: ${result.lastInsertRowid}`);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as UserRow;
  return toUserRecord(row);
}

/**
 * 更新用户信息（显示名、角色）
 * @returns 更新后的用户记录，用户不存在时返回 null
 */
export async function updateUser(
  id: string,
  fields: { displayName?: string; role?: BlogUserRole; password?: string },
): Promise<UserRecord | null> {
  await ensureSeedAdminUser();
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  const db = getDatabase();
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(numericId) as UserRow | undefined;
  if (!existing) return null;

  const displayName = fields.displayName ?? existing.display_name;
  const role = fields.role ?? existing.role;

  if (fields.password) {
    const passwordHash = await hashPassword(fields.password);
    db.prepare(
      `UPDATE users SET display_name = @displayName, role = @role, password_hash = @passwordHash,
       updated_at = CURRENT_TIMESTAMP WHERE id = @id`,
    ).run({ displayName, role, passwordHash, id: numericId });
  } else {
    db.prepare(
      `UPDATE users SET display_name = @displayName, role = @role,
       updated_at = CURRENT_TIMESTAMP WHERE id = @id`,
    ).run({ displayName, role, id: numericId });
  }

  console.log(`[Auth DB] 更新用户 ID:${id}, 显示名:${displayName}, 角色:${role}`);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(numericId) as UserRow;
  return toUserRecord(row);
}

/**
 * 删除用户
 * @returns 是否删除成功
 */
export async function deleteUser(id: string): Promise<boolean> {
  await ensureSeedAdminUser();
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return false;

  const db = getDatabase();
  const result = db.prepare("DELETE FROM users WHERE id = ?").run(numericId);

  if (result.changes > 0) {
    console.log(`[Auth DB] 删除用户 ID:${id}`);
    return true;
  }
  return false;
}

// ===== 注册 & 找回密码 数据库操作 =====

/**
 * 通过邮箱查找用户
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const normalized = email.toLowerCase().trim();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalized) as UserRow | undefined;
  return row ? toUserRecord(row) : null;
}

/**
 * 检查邮箱是否已被注册
 */
export async function isEmailTaken(email: string): Promise<boolean> {
  const user = await findUserByEmail(email);
  return user !== null;
}

/**
 * 检查用户名是否已被注册
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const normalized = normalizeUsername(username);
  if (!normalized) return false;
  const row = db.prepare("SELECT 1 FROM users WHERE username = ?").get(normalized);
  return row !== undefined;
}

/**
 * 通过重置 token 查找用户
 */
export async function getUserByResetToken(token: string): Promise<UserRecord | null> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')")
    .get(token) as UserRow | undefined;
  return row ? toUserRecord(row) : null;
}

/**
 * 保存重置 token
 */
export async function setResetToken(userId: string, token: string, expiresAt: string): Promise<void> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const numericId = Number(userId);
  db.prepare(
    "UPDATE users SET reset_token = @token, reset_token_expires = @expires WHERE id = @id",
  ).run({ token, expires: expiresAt, id: numericId });
}

/**
 * 清除重置 token（重置成功后调用）
 */
export async function clearResetToken(userId: string): Promise<void> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const numericId = Number(userId);
  db.prepare(
    "UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = @id",
  ).run({ id: numericId });
}

/**
 * 更新用户密码
 */
export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  await ensureSeedAdminUser();
  const db = getDatabase();
  const numericId = Number(userId);
  const passwordHash = await hashPassword(newPassword);
  db.prepare(
    "UPDATE users SET password_hash = @hash, updated_at = CURRENT_TIMESTAMP WHERE id = @id",
  ).run({ hash: passwordHash, id: numericId });
}

/**
 * 注册新用户（邮箱+密码）
 * @returns 创建的用户记录
 */
export async function registerUser(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserRecord> {
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail.includes("@")) {
    throw new Error("邮箱格式不正确");
  }
  if (password.length < 6) {
    throw new Error("密码长度不能少于 6 位");
  }

  const emailTaken = await isEmailTaken(normalizedEmail);
  if (emailTaken) {
    throw new Error("该邮箱已被注册");
  }

  // 用邮箱作为 username，displayName 默认为邮箱 @ 前面部分
  const display = (displayName?.trim() || normalizedEmail.split("@")[0]) ?? '';
  return await createUser(normalizedEmail, display, password, "user", normalizedEmail);
}
