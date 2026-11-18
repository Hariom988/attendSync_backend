import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { signToken, cookieOptions, COOKIE_NAME } from '../utils/token.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const INVALID_MESSAGE = 'Invalid email or password';
const DUMMY_HASH = await bcrypt.hash('not-a-real-password', 12);

export async function adminLogin(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, is_active,
            (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
     FROM admins WHERE email = ?`,
    [email]
  );
  const admin = rows[0];

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH);
    return res.status(401).json({ message: INVALID_MESSAGE });
  }

  if (admin.is_locked) {
    return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);

  if (!passwordMatches) {
    await pool.execute(
      `UPDATE admins
       SET locked_until = IF(failed_login_attempts + 1 >= ${MAX_FAILED_ATTEMPTS},
                             DATE_ADD(NOW(), INTERVAL ${LOCK_MINUTES} MINUTE), locked_until),
           failed_login_attempts = IF(failed_login_attempts + 1 >= ${MAX_FAILED_ATTEMPTS},
                                      0, failed_login_attempts + 1)
       WHERE id = ?`,
      [admin.id]
    );
    return res.status(401).json({ message: INVALID_MESSAGE });
  }

  if (!admin.is_active) {
    return res.status(403).json({ message: 'This account has been deactivated' });
  }

  await pool.execute(
    'UPDATE admins SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
    [admin.id]
  );

  const token = signToken({ id: admin.id, role: admin.role });
  res.cookie(COOKIE_NAME, token, cookieOptions());

  res.json({
    user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}
export async function me(req, res) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, is_active FROM admins WHERE id = ?',
    [req.user.id]
  );
  const admin = rows[0];

  if (!admin || !admin.is_active) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({
    user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ message: 'Logged out' });
}