import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { validateAccountInput } from '../utils/validators.js';

const SALT_ROUNDS = 12;
const HR_COLUMNS = 'id, name, email, role, is_active, created_at, last_login';

export async function createHr(req, res) {
  const { values, errors } = validateAccountInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const passwordHash = await bcrypt.hash(values.password, SALT_ROUNDS);

  try {
    const [result] = await pool.execute(
      'INSERT INTO hrs (name, email, password_hash) VALUES (?, ?, ?)',
      [values.name, values.email, passwordHash]
    );
    const [rows] = await pool.execute(
      `SELECT ${HR_COLUMNS} FROM hrs WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json({ hr: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An HR account with this email already exists' });
    }
    throw error;
  }
}

export async function listHrs(req, res) {
  const [rows] = await pool.execute(
    `SELECT ${HR_COLUMNS} FROM hrs ORDER BY created_at DESC, id DESC`
  );
  res.json({ hrs: rows });
}

export async function getHr(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  const [rows] = await pool.execute(
    `SELECT ${HR_COLUMNS} FROM hrs WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'HR not found' });
  }
  res.json({ hr: rows[0] });
}