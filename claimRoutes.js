const express = require('express');
const { body } = require('express-validator');
const {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaimStatus,
} = require('../controllers/claimController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  upload.single('proofImage'),
  [
    body('itemId').isInt({ min: 1 }).withMessage('Valid item ID is required.'),
    body('lostItemId').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid lost item ID.'),
    body('proofText')
      .trim()
      .isLength({ min: 10, max: 1200 })
      .withMessage('Please provide proof details (at least 10 characters) to verify ownership.'),
  ],
  validate,
  createClaim
);

router.get('/my', protect, getMyClaims);
router.get('/', protect, adminOnly, getAllClaims);

router.patch(
  '/:id/status',
  protect,
  adminOnly,
  [
    body('status')
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Claim status must be pending, approved, or rejected.'),
    body('adminNote').optional().trim().isLength({ max: 500 }).withMessage('Admin note is too long.'),
  ],
  validate,
  updateClaimStatus
);

module.exports = router;

