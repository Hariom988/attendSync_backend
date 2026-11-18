import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { validateEmployeeInput, validateAssignmentInput} from '../utils/validators.js';

const SALT_ROUNDS = 12;

const EMPLOYEE_SELECT = `
  SELECT e.id, e.name, e.email, e.role, e.employee_code, e.designation,
         DATE_FORMAT(e.date_of_joining, '%Y-%m-%d') AS date_of_joining,
         e.phone, e.is_active, e.created_at, e.last_login,
         e.department_id, d.name AS department_name,
         e.shift_id, s.name AS shift_name,
         e.created_by
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department_id
  LEFT JOIN shifts s ON s.id = e.shift_id`;

export async function createEmployee(req, res) {
  const { values, errors } = validateEmployeeInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const passwordHash = await bcrypt.hash(values.password, SALT_ROUNDS);

  try {
    const [result] = await pool.execute(
      `INSERT INTO employees
         (name, email, password_hash, employee_code, department_id, designation,
          date_of_joining, shift_id, phone, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.name,
        values.email,
        passwordHash,
        values.employeeCode,
        values.departmentId,
        values.designation,
        values.dateOfJoining,
        values.shiftId,
        values.phone,
        req.user.id,
      ]
    );

    const [rows] = await pool.execute(`${EMPLOYEE_SELECT} WHERE e.id = ?`, [result.insertId]);
    res.status(201).json({ employee: rows[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const field = error.message.includes('uq_employees_code') ? 'employee code' : 'email';
      return res.status(409).json({ message: `An employee with this ${field} already exists` });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'The selected department or shift does not exist' });
    }
    throw error;
  }
}

export async function listEmployees(req, res) {
  const [rows] = await pool.execute(`${EMPLOYEE_SELECT} ORDER BY e.created_at DESC, e.id DESC`);
  res.json({ employees: rows });
}

export async function getEmployee(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  const [rows] = await pool.execute(`${EMPLOYEE_SELECT} WHERE e.id = ?`, [id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  res.json({ employee: rows[0] });
}
export async function updateAssignment(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  const { changes, errors } = validateAssignmentInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const assignments = Object.keys(changes).map((column) => `${column} = ?`).join(', ');

  try {
    await pool.execute(
      `UPDATE employees SET ${assignments} WHERE id = ?`,
      [...Object.values(changes), id]
    );
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'The selected department or shift does not exist' });
    }
    throw error;
  }

  const [rows] = await pool.execute(`${EMPLOYEE_SELECT} WHERE e.id = ?`, [id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  res.json({ employee: rows[0] });
}