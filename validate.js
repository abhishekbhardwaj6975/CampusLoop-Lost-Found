const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return res.status(400).json({
      success: false,
      message: formatted[0]?.message || 'Validation failed',
      errors: formatted,
    });
  }
  next();
}

module.exports = validate;

