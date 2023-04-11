module.exports = (error, next) => {
  error.httpStatusCode = 500;
  return next(error);
};

exports.throwError = (message, statusCode, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.data = errors;
  throw error;
};
