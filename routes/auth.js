const express = require("express");
const { check, body } = require("express-validator");
const loginController = require("../controllers/auth");

const router = express.Router();

router.get("/login", loginController.getLogin);
router.get("/signup", loginController.getSignup);
router.post(
  "/login",
  [
    check("email", "Please Enter a valid email")
      .isEmail()
      .normalizeEmail()
      .trim(),
    body("password", "Invalid password or email")
      .isAlphanumeric()
      .trim()
      .isLength({ min: 8 }),
  ],
  loginController.postLogin
);
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .normalizeEmail()
      .trim()
      .withMessage("Please enter a valid email")
      .custom((value, __) => {
        if (value === "test@test.com") {
          throw new Error("This email is forbidden");
        }
        return true;
      }),
    body(
      "password",
      "Please enter a password that is 8 or more characters long and should only have letters and numbers"
    )
      .isAlphanumeric()
      .trim()
      .isLength({ min: 8 }),
    body("confirmPassword").custom((value, { req }) => {
      console.log();
      if (value !== req.body.password) {
        throw new Error("Passwords Have to Match!");
      }
      return true;
    }),
  ],
  loginController.postSignup
);
router.post("/logout", loginController.postLogOut);
router.post("/reset", loginController.postReset);
router.get("/reset", loginController.getReset);
router.get("/reset/:token", loginController.getNewPassword);
router.post("/new-password", loginController.postNewPassword);

module.exports = router;
