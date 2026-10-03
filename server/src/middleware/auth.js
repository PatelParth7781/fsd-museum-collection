import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Protect routes - require valid JWT
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    if (!req.user.is_active) {
      return res.status(403).json({ error: 'User account is deactivated' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role '${req.user?.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};
