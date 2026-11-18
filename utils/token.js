import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'token';

const IDLE_MINUTES = Number(process.env.JWT_IDLE_TIMEOUT_MINUTES);

export function signToken({ id, role }, authTime = Math.floor(Date.now() / 1000)) {
  return jwt.sign({ id, role, authTime }, process.env.JWT_SECRET, {
    expiresIn: `${IDLE_MINUTES}m`,
  });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: IDLE_MINUTES * 60 * 1000,
    path: '/',
  };
}