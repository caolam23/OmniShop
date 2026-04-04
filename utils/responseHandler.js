// Utility functions để format response chún

// Success response
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Error response
const errorResponse = (res, message = 'Error', statusCode = 500, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(data && { data }),
    timestamp: new Date().toISOString(),
  });
};

// Pagination helper
const getPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    limit: limitNum,
    page: pageNum,
  };
};

module.exports = {
  successResponse,
  errorResponse,
  getPagination,
};
