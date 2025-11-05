/**
 * Authentication Middleware
 *
 * Validates JWT tokens from AWS Cognito and enforces role-based access control
 * Implements Feature 1.5 (RBAC) and secures Feature 2.2 (Backend Quote API)
 */

import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Cognito JWT Verifier configuration
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
});

/**
 * Middleware: Verify JWT token and attach user to request
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function authenticateToken(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Cognito
    const payload = await verifier.verify(token);

    // Extract user information from token payload
    req.user = {
      sub: payload.sub, // Cognito user ID
      email: payload.email,
      username: payload.username,
      role: payload['custom:role'] || 'field_worker', // Custom attribute from Cognito
      groups: payload['cognito:groups'] || [], // Cognito groups
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);

    // Token expired or invalid
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      details: error.message,
    });
  }
}

/**
 * Middleware: Require admin role
 * Must be used AFTER authenticateToken middleware
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Use authenticateToken middleware first.',
    });
  }

  // Check if user has admin role
  const isAdmin = req.user.role === 'admin' || req.user.groups.includes('admins');

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
      userRole: req.user.role,
    });
  }

  next();
}

/**
 * Middleware: Require specific role
 * Must be used AFTER authenticateToken middleware
 *
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Use authenticateToken middleware first.',
      });
    }

    // Check if user's role is in allowed roles
    const hasRole = allowedRoles.includes(req.user.role);

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: req.user.role,
      });
    }

    next();
  };
}
