import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { signToken, cookieOptions, COOKIE_NAME } from '../utils/token.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const INVALID_MESSAGE = 'Invalid email or password';
const DUMMY_HASH = await bcrypt.hash('not-a-real-password', 12);

const ACCOUNT_TABLES = new Map([
  ['admin', 'admins'],
  ['hr', 'hrs'],
  ['employee', 'employees'],
]);

async function loginWithRole(role, req, res) {
  const table = ACCOUNT_TABLES.get(role);
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, is_active,
            (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
     FROM ${table} WHERE email = ?`,
    [email]
  );
  const account = rows[0];

  if (!account) {
    await bcrypt.compare(password, DUMMY_HASH);
    return res.status(401).json({ message: INVALID_MESSAGE });
  }

  if (account.is_locked) {
    return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
  }

  const passwordMatches = await bcrypt.compare(password, account.password_hash);

  if (!passwordMatches) {
    await pool.execute(
      `UPDATE ${table}
       SET locked_until = IF(failed_login_attempts + 1 >= ${MAX_FAILED_ATTEMPTS},
                             DATE_ADD(NOW(), INTERVAL ${LOCK_MINUTES} MINUTE), locked_until),
           failed_login_attempts = IF(failed_login_attempts + 1 >= ${MAX_FAILED_ATTEMPTS},
                                      0, failed_login_attempts + 1)
       WHERE id = ?`,
      [account.id]
    );
    return res.status(401).json({ message: INVALID_MESSAGE });
  }

  if (!account.is_active) {
    return res.status(403).json({ message: 'This account has been deactivated' });
  }

  await pool.execute(
    `UPDATE ${table} SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?`,
    [account.id]
  );

  const token = signToken({ id: account.id, role: account.role });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.json({
    user: { id: account.id, name: account.name, email: account.email, role: account.role },
  });
}

export function adminLogin(req, res) {
  return loginWithRole('admin', req, res);
}

export function userLogin(req, res) {
  const role = String(req.body?.role ?? '');
  if (role !== 'hr' && role !== 'employee') {
    return res.status(400).json({ message: 'Role must be either hr or employee' });
  }
  return loginWithRole(role, req, res);
}

export async function me(req, res) {
  const table = ACCOUNT_TABLES.get(req.user.role);
  if (!table) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const [rows] = await pool.execute(
    `SELECT id, name, email, role, is_active FROM ${table} WHERE id = ?`,
    [req.user.id]
  );
  const account = rows[0];

  if (!account || !account.is_active) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({
    user: { id: account.id, name: account.name, email: account.email, role: account.role },
  });
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ message: 'Logged out' });
}