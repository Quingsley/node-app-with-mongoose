const bcrypt = require("bcryptjs");
const sendGridMail = require("@sendgrid/mail");
require("dotenv").config();
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const SECRET = require("../utils/password").SECRET;
const crypto = require("crypto");
const User = require("../models/user");
const errorHandler = require("../utils/errorhandler");

sendGridMail.setApiKey(process.env.SEND_GRID_KEY);


exports.postLogin = async (request, response, next) => {
  try {
    const email = request.body.email;
    const password = request.body.password;
    const error = validationResult(request).errors;

    if (error.length > 0) {
      return response.status(422).json({
        message: error[0].msg,
      });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return response
        .status(422)
        .json({ message: "Invalid email or password" });
    } else {
      const doPasswordsMatch = await bcrypt.compare(password, user.password);
      if (doPasswordsMatch) {
        const token = jwt.sign(
          {
            email: user.email,
            userId: user._id,
          },
          `${SECRET}`,
          { expiresIn: "1h" }
        );

        return response.status(200).json({
          token: token,
          userId: user._id.toString(),
        });
      } else {
        return response
          .status(422)
          .json({ message: "Invalid email or Password" });
      }
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postSignup = async (request, response, next) => {
  const email = request.body.email;
  const password = request.body.password;
  const error = validationResult(request).errors;

  if (error.length > 0) {
    return response.status(422).json({ message: error[0].msg });
  }
  try {
    const isEmailPresent = await User.findOne({ email: email });
    if (isEmailPresent) {
      return response.status(422).json({
        message: "Email already exists please pick a different email",
      });
    } else {
      const HASHED_PASSWORD = await bcrypt.hash(password, 12);
      const user = new User({
        email: email,
        password: HASHED_PASSWORD,
        cart: { items: [] },
      });
      const result = await user.save();
      if (result) {
        const msg = {
          to: email,
          from: "jerome@kberen.com",
          subject: "Welcome to shop app 🏪",
          text: "Sign up successful",
          html: "<strong>Find products of your choice!</strong>",
        };

        await sendGridMail.send(msg);
        return response.status(201).json({
          message: "User Created successfully",
          user: result._id,
        });
      }
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postReset = async (request, response, next) => {
  let token;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.error(err);

      return response.status(500).json({ message: "Internal server error" });
    }
    token = buffer.toString("hex");
  });
  try {
    const currentUser = await User.findOne({ email: request.body.email });
    if (!currentUser) {
      return response
        .status(422)
        .json({ message: "No account with that email found" });
    }
    currentUser.resetToken = token;
    currentUser.resetTokenExpirationDate = Date.now() + 360000; // expires after 1 hour
    const result = await currentUser.save();
    if (result) {
      response.status(200).json({
        message: "An email Has been sent for you to reset your token",
        resetToken: token, // To be used when reseting password
      });
      const msg = {
        to: currentUser.email,
        from: "jerome@kberen.com",
        subject: "Reset Password",
        text: "Kindly reset your password",
        html: `<p>Click the link to reset your password <a href="http://localhost:3000/reset/${token}">RESET PASSWORD</a></p>`,
      };

      await sendGridMail.send(msg);
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getNewPassword = async (request, response, next) => {
  const token = request.params.token;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpirationDate: { $gt: Date.now() },
    });
    if (!user) {
      response.status(422).json({ message: "Reset Token already expired" });
    }
  } catch (err) {
    errorHandler(err, next);
  }
};

exports.postNewPassword = async (request, response, next) => {
  const userId = request.body.userId;
  const newPassword = request.body.password;
  const token = request.body.token; //its not jsonweb token
  try {
    const user = await User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExpirationDate: { $gt: Date.now() },
    });
    if (user) {
      const HASHED_PASSWORD = await bcrypt.hash(newPassword, 12);
      user.password = HASHED_PASSWORD;
      user.resetToken = undefined;
      user.resetTokenExpirationDate = undefined;
      const result = await user.save();
      if (result) {
        response.status(200).json({ message: "Password updated successfully" });
      }
    }
  } catch (error) {
    errorHandler(error, next);
  }
};
