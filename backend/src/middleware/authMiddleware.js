// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // Grab the token from the request headers
  const authHeader = req.headers['authorization'];
  
  // It usually comes in as "Bearer <token>", so we split it to get just the token
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Access Denied. No token provided.' });
  }

  try {
    // Verify the token using your secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach the decoded admin_id to the request
    next(); // Pass them through to the route!
  } catch (err) {
    res.status(401).json({ error: 'Invalid or Expired Token' });
  }
};