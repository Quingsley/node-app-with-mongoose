const bcrypt = require("bcryptjs");
const sendGridMail = require("@sendgrid/mail");
require("dotenv").config();
const { validationResult } = require("express-validator");

const crypto = require("crypto");

const User = require("../models/user");
const errorHandler = require("../utils/errorhandler");

sendGridMail.setApiKey(process.env.SEND_GRID_KEY);

const errorMessage = (request) => {
  let message = request.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  return message;
};

exports.getLogin = (request, response, next) => {
  //   const isLoggedIn = request.get("Cookie").split("=")[1].trim() === "true";
  //   console.log(isLoggedIn);
  //   console.log(request.session.user);

  response.render("auth/login", {
    docTitle: "Login",
    path: "/login",
    errorMessage: errorMessage(request),
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.getSignup = (request, response, next) => {
  response.render("auth/signup", {
    docTitle: "Signup",
    path: "/signup",
    errorMessage: errorMessage(request),
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = async (request, response, next) => {
  try {
    const email = request.body.email;
    const password = request.body.password;
    const error = validationResult(request).errors;

    if (error.length > 0) {
      return response.status(422).render("auth/login", {
        docTitle: "Login",
        path: "/login",
        errorMessage: error[0].msg,
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: error,
      });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      request.flash("error", "Invalid email or password");
      return response.status(422).render("auth/login", {
        docTitle: "Login",
        path: "/login",
        errorMessage: errorMessage(request),
        oldInput: {
          email: email,
          password: password,
        },
        validationErrors: [],
      });
    } else {
      const doPasswordsMatch = await bcrypt.compare(password, user.password);
      if (doPasswordsMatch) {
        request.session.user = user;
        request.session.isLoggedIn = true;
        request.session.save((error) => {
          console.error(error);
          return response.redirect("/");
        });
      } else {
        request.flash("error", "Invalid email or password");
        return response.status(422).render("auth/login", {
          docTitle: "Login",
          path: "/login",
          errorMessage: errorMessage(request),
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
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
    return response.status(422).render("auth/signup", {
      docTitle: "Signup",
      path: "/signup",
      errorMessage: error[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: request.body.confirmPassword,
      },
      validationErrors: error,
    });
  }
  try {
    const isEmailPresent = await User.findOne({ email: email });
    if (isEmailPresent) {
      request.flash(
        "error",
        "Email already exists please pick a different email"
      );
      return response.redirect("/signup"); // email already exists in db so redirect error handled later
    } else {
      const HASHED_PASSWORD = await bcrypt.hash(password, 12);
      const user = new User({
        email: email,
        password: HASHED_PASSWORD,
        cart: { items: [] },
      });
      const result = await user.save();
      if (result) {
        response.redirect("/login");
        const msg = {
          to: email,
          from: "jerome@kberen.com",
          subject: "Welcome to shop app 🏪",
          text: "Sign up successful",
          html: "<strong>Find products of your choice!</strong>",
        };

        await sendGridMail.send(msg);
      }
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postLogOut = (request, response, next) => {
  request.session.destroy((err) => {
    console.error(err);
    response.redirect("/");
  });
};

exports.getReset = (request, response, next) => {
  response.render("auth/reset", {
    docTitle: "Reset Passowrd",
    path: "/reset",
    errorMessage: errorMessage(request),
  });
};

exports.postReset = async (request, response, next) => {
  let token;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.error(err);
      return response.redirect("/reset");
    }
    token = buffer.toString("hex");
  });
  try {
    const currentUser = await User.findOne({ email: request.body.email });
    if (!currentUser) {
      request.flash("error", "No account with that email found");
      return response.redirect("/reset");
    }
    currentUser.resetToken = token;
    currentUser.resetTokenExpirationDate = Date.now() + 360000; // expires after 1 hour
    const result = await currentUser.save();
    if (result) {
      response.redirect("/");
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
      response.redirect("/reset");
    }
    if (user) {
      response.render("auth/new-password", {
        docTitle: "Update Password",
        path: "/new-password",
        errorMessage: errorMessage(request),
        userId: user._id.toString(),
        token: token,
      });
    }
  } catch (err) {
    errorHandler(err, next);
  }
};

exports.postNewPassword = async (request, response, next) => {
  const userId = request.body.userId;
  const newPassword = request.body.password;
  const token = request.body.token;
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
        response.redirect("/login");
      }
    }
  } catch (error) {
    errorHandler(error, next);
  }
};
