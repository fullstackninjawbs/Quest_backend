/**
 * Wraps async route handlers to avoid repetitive try/catch blocks.
 * Automatically forwards errors to Express's next() error handler.
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
