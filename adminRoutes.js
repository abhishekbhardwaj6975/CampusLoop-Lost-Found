const express = require('express');
const { body } = require('express-validator');
const { getStats, getUsers, updateUser, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);

router.patch(
  '/users/:id',
  [
    body('isBlocked').optional().isBoolean().withMessage('isBlocked must be a boolean.'),
    body('role').optional().isIn(['student', 'admin']).withMessage('Role must be student or admin.'),
  ],
  validate,
  updateUser
);

router.delete('/users/:id', deleteUser);

module.exports = router;

