const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone = '', department = '' } = req.body;

    const existing = UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      phone,
      department,
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CampusLoop.',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const userWithHash = UserModel.findByEmail(email, true);
    if (!userWithHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, userWithHash.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (userWithHash.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the campus administrator.',
      });
    }

    const { password: _removed, ...user } = userWithHash;
    const token = signToken(user);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

function updateProfile(req, res, next) {
  try {
    const { name, phone, department } = req.body;
    const updated = UserModel.updateProfile(req.user.id, { name, phone, department });
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userWithHash = UserModel.findById(req.user.id, true);

    const isMatch = await bcrypt.compare(currentPassword, userWithHash.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    UserModel.updatePassword(req.user.id, hashed);

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, updateProfile, changePassword };

