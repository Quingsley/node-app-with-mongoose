module.exports = (error, next) => {
  error.httpStatusCode = 500;
  return next(error);
};
