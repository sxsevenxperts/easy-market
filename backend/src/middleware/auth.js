/**
 * JWT Authentication Middleware
 * Simple token validation for Smart Market API
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * Verify JWT token
 * Extracts and validates token from Authorization header
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // If no token, allow for now (development mode)
  if (!authHeader) {
    req.user = { sub: 'sistema', role: 'user' };
    return next();
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token, continue as guest
    req.user = { sub: 'sistema', role: 'user' };
    next();
  }
}

/**
 * Require valid token (optional - for future use)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      sucesso: false, 
      erro: 'Token de autenticação obrigatório' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      sucesso: false, 
      erro: 'Token inválido ou expirado' 
    });
  }
}

/**
 * Generate JWT token (for login endpoints)
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = {
  verifyToken,
  requireAuth,
  generateToken,
};
