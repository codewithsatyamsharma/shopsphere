// Express 4 does not catch rejected promises from async handlers.
// This wrapper forwards them to the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
