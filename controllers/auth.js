const User = require("../models/user");
exports.getLogin = (request, response, next) => {
  //   const isLoggedIn = request.get("Cookie").split("=")[1].trim() === "true";
  //   console.log(isLoggedIn);
  //   console.log(request.session.user);
  response.render("auth/login", {
    docTitle: "Login",
    path: "/login",
    isAuthenticated: false,
  });
};

exports.postLogin = async (request, response, next) => {
  try {
    const user = await User.findById("63a95f43874be80007ed4584");
    if (!user) {
      response.redirect("/404");
    }
    request.session.user = user;
    request.session.isLoggedIn = true;
    request.session.save((error) => {
      console.log(error);
      response.redirect("/");
    });
    // next();
  } catch (error) {
    console.log(error);
  }
};

exports.postLogOut = (request, response, next) => {
  request.session.destroy((err) => {
    console.log(err);
    response.redirect("/");
  });
};
