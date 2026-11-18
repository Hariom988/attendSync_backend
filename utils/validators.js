const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAccountInput(body) {
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const errors = [];

  if (name.length < 2 || name.length > 150) {
    errors.push('Name must be between 2 and 150 characters');
  }
  if (email.length > 200 || !EMAIL_PATTERN.test(email)) {
    errors.push('A valid email is required (max 200 characters)');
  }
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    errors.push('Password must be at least 8 characters and at most 72 bytes');
  }

  return { values: { name, email, password }, errors };
}
function optionalId(value, label, errors) {
  if (value === undefined || value === null || value === '') return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    errors.push(`${label} must be a positive whole number`);
    return null;
  }
  return id;
}

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateEmployeeInput(body) {
  const { values: account, errors } = validateAccountInput(body);

  const employeeCode = String(body?.employee_code ?? '').trim();
  const designation = String(body?.designation ?? '').trim();
  const dateOfJoining = String(body?.date_of_joining ?? '').trim();
  const phoneRaw = String(body?.phone ?? '').trim();

  if (employeeCode.length < 1 || employeeCode.length > 50) {
    errors.push('Employee code is required (max 50 characters)');
  }
  if (designation.length < 2 || designation.length > 100) {
    errors.push('Designation must be between 2 and 100 characters');
  }
  if (!isRealDate(dateOfJoining)) {
    errors.push('Date of joining must be a real date in YYYY-MM-DD format');
  }
  if (phoneRaw && (phoneRaw.length < 7 || phoneRaw.length > 20 || !/^[0-9+()\-\s]+$/.test(phoneRaw))) {
    errors.push('Phone must be 7 to 20 characters: digits, spaces, + ( ) -');
  }

  const departmentId = optionalId(body?.department_id, 'Department id', errors);
  const shiftId = optionalId(body?.shift_id, 'Shift id', errors);

  return {
    values: {
      ...account,
      employeeCode,
      designation,
      dateOfJoining,
      phone: phoneRaw || null,
      departmentId,
      shiftId,
    },
    errors,
  };
}