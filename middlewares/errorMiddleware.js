// Middleware xử lý lỗi chung cho toàn ứng dụng

const errorMiddleware = (err, req, res, next) => {
  // Set giá trị mặc định
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Sai định dạng MongoDB ID
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.path}`,
    });
  }

  // Lỗi validation từ Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    return res.status(400).json({
      success: false,
      message: messages,
    });
  }

  // Duplicate key (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Trả về response chung
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
