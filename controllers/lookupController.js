import pool from '../config/db.js';

function validateName(body) {
  const name = String(body?.name ?? '').trim();
  const errors = [];
  if (name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  return { name, errors };
}

export function makeLookupController(table, label) {
  async function create(req, res) {
    const { name, errors } = validateName(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    try {
      const [result] = await pool.execute(`INSERT INTO ${table} (name) VALUES (?)`, [name]);
      res.status(201).json({ [label]: { id: result.insertId, name } });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: `A ${label} with this name already exists` });
      }
      throw error;
    }
  }

  async function list(req, res) {
    const [rows] = await pool.execute(`SELECT id, name FROM ${table} ORDER BY name`);
    res.json({ [`${label}s`]: rows });
  }

  return { create, list };
}