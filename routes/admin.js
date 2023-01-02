const express = require("express");
const { body } = require("express-validator/check");
const adminProductsController = require("../controllers/admin");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get("/add-product", isAuth, adminProductsController.getAddProduct);

router.post(
  "/add-product",
  isAuth,
  [
    body("title", "Enter a vaild Title").isString().trim().isLength({ min: 3 }),
    // body("imageUrl", "Enter a vaild URL").trim().isURL(),
    body("price", "Enter a valid price").isFloat().trim(),
    body(
      "description",
      "Enter a valid description between 5 and 200 characters"
    )
      .trim()
      .isLength({ min: 5, max: 200 }),
  ],
  adminProductsController.postAddProduct
);

router.get("/products", isAuth, adminProductsController.getProducts);

router.get(
  "/edit-product/:productId",
  isAuth,
  adminProductsController.getEditProduct
);

router.post(
  "/edit-product",
  isAuth,
  [
    body("title", "Enter a vaild Title").isString().trim().isLength({ min: 3 }),
    // body("imageUrl", "Enter a vaild URL").trim().isURL(),
    body("price", "Enter a valid price").isFloat().trim(),
    body(
      "description",
      "Enter a valid description between 5 and 200 characters"
    )
      .trim()
      .isLength({ min: 5, max: 200 }),
  ],
  adminProductsController.postEditProduct
);

router.post(
  "/delete-product",
  isAuth,
  adminProductsController.postDeleteProduct
);

module.exports = router;
