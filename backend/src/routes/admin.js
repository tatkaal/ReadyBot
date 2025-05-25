const express = require('express');
const router = express.Router();
const { Admin } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/admin/profile
// @desc    Get admin profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Server error retrieving admin profile' });
  }
});

// @route   PUT api/admin/profile
// @desc    Update admin profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const admin = await Admin.findByPk(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    
    await admin.save();
    
    // Return updated admin without password
    const updatedAdmin = await Admin.findByPk(req.admin.id, {
      attributes: { exclude: ['password'] }
    });
    
    res.json(updatedAdmin);
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ message: 'Server error updating admin profile' });
  }
});

// @route   PUT api/admin/password
// @desc    Update admin password
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    const admin = await Admin.findByPk(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    admin.password = newPassword;
    await admin.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update admin password error:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

module.exports = router; 