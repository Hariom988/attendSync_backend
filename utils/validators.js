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