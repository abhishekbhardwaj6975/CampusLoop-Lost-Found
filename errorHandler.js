const multer = require('multer');

function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = Number(process.env.MAX_FILE_SIZE_MB) || 5;
      message = `File is too large. Maximum allowed size is ${maxMb}MB per image.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'You can upload up to 4 images per item.';
    } else {
      message = err.message;
    }
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { notFound, errorHandler };

