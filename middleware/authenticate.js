import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { signToken, cookieOptions, COOKIE_NAME } from '../utils/token.js';

const MAX_SESSION_SECONDS = Number(process.env.SESSION_MAX_HOURS) * 60 * 60;

export function authenticate(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    const message = error.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token';
    return res.status(401).json({ message });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - payload.authTime > MAX_SESSION_SECONDS) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ message: 'Session expired' });
  }

  req.user = { id: payload.id, role: payload.role };

  res.cookie(COOKIE_NAME, signToken(req.user, payload.authTime), cookieOptions());
  next();
}