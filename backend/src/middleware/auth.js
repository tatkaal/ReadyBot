const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { Op } = require('sequelize');

module.exports = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'readybot-secret-key');
    
    // Check if admin exists
    const admin = await Admin.findByPk(decoded.admin.id);
    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Set admin in request
    req.admin = decoded.admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
