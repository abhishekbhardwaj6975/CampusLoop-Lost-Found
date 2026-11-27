const express = require('express');
const { body } = require('express-validator');
const {
  getPublicStats,
  getItems,
  getMyItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  getItemMatches,
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = express.Router();

const itemValidationRules = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be between 3 and 120 characters.'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1500 })
    .withMessage('Description must be between 10 and 1500 characters.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('type').isIn(['lost', 'found']).withMessage('Type must be either "lost" or "found".'),
  body('location').trim().isLength({ min: 2, max: 120 }).withMessage('Campus location is required.'),
  body('date').trim().notEmpty().withMessage('Date is required.'),
];

router.get('/stats', getPublicStats);
router.get('/my', protect, getMyItems);
router.get('/', getItems);
router.get('/:id/matches', getItemMatches);
router.get('/:id', getItemById);

router.post('/', protect, upload.array('images', 4), itemValidationRules, validate, createItem);

router.put('/:id', protect, upload.array('images', 4), itemValidationRules, validate, updateItem);

router.patch(
  '/:id/status',
  protect,
  [
    body('status')
      .isIn(['open', 'claimed', 'returned'])
      .withMessage('Status must be open, claimed, or returned.'),
  ],
  validate,
  updateItemStatus
);

router.delete('/:id', protect, deleteItem);

module.exports = router;

