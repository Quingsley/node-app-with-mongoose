const jwt = require("jsonwebtoken");
const throwError = require("../utils/errorhandler").throwError;
const secret = require("../utils/password").SECRET;
const User = require("../models/user");

module.exports = async (req, res, next) => {
  try {
    const header = req.get("Authorization");
    if (!header) {
      throwError("Not Authenticated", 401);
    }

    const token = header.split(" ")[1];
    const decodedToken = jwt.verify(token, secret);
    if (!decodedToken) {
      throwError("Not authorized", 401);
    }
    req.userId = decodedToken.userId;
    const user = await User.findById(req.userId);
    if (!user) {
      throwError("Not Authorized", 401);
    }
    req.user = user;
    next();
  } catch (errors) {
    throw errors;
  }
};
