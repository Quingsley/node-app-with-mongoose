const bcrypt = require("bcryptjs");
const sendGridMail = require("@sendgrid/mail");
const User = require("../models/user");
const sendGridApiKey = require("../utils/password").sendgridkey;
sendGridMail.setApiKey(sendGridApiKey);

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
  });
};

exports.getSignup = (request, response, next) => {
  response.render("auth/signup", {
    docTitle: "Signup",
    path: "/signup",
    errorMessage: errorMessage(request),
  });
};

exports.postLogin = async (request, response, next) => {
  try {
    const email = request.body.email;
    const password = request.body.password;
    const user = await User.findOne({ email: email });
    if (!user) {
      request.flash("error", "Invalid email or password");
      return response.redirect("/login");
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
        return response.redirect("/login");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

exports.postSignup = async (request, response, next) => {
  const email = request.body.email;
  const password = request.body.password;
  const confirmPassword = request.body.confirmPassword;
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
          to: email, // Change to your recipient
          from: "jerome@kberen.com",
          subject: "Sending with SendGrid is Fun",
          text: "and easy to do anywhere, even with Node.js",
          html: "<strong>and easy to do anywhere, even with Node.js</strong>",
        };

        await sendGridMail.send(msg);
      }
    }
  } catch (error) {
    console.error("ERROR", error);
  }
};

exports.postLogOut = (request, response, next) => {
  request.session.destroy((err) => {
    console.error(err);
    response.redirect("/");
  });
};
