const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
    body('email').trim().isEmail().withMessage('Please enter a valid college email address.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number is too long.'),
    body('department').optional().trim().isLength({ max: 80 }).withMessage('Department name is too long.'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
    body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number is too long.'),
    body('department').optional().trim().isLength({ max: 80 }).withMessage('Department name is too long.'),
  ],
  validate,
  updateProfile
);

router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long.'),
  ],
  validate,
  changePassword
);

module.exports = router;

