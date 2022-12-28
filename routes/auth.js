const express = require("express");

const loginController = require("../controllers/auth");

const router = express.Router();

router.get("/login", loginController.getLogin);
router.get("/signup", loginController.getSignup);
router.post("/login", loginController.postLogin);
router.post("/signup", loginController.postSignup);
router.post("/logout", loginController.postLogOut);

module.exports = router;
