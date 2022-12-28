const express = require("express");

const adminProductsController = require("../controllers/admin");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get("/add-product", isAuth, adminProductsController.getAddProduct);

router.post("/add-product", isAuth, adminProductsController.postAddProduct);

router.get("/products", isAuth, adminProductsController.getProducts);

router.get(
  "/edit-product/:productId",
  isAuth,
  adminProductsController.getEditProduct
);

router.post("/edit-product", isAuth, adminProductsController.postEditProduct);

router.post(
  "/delete-product",
  isAuth,
  adminProductsController.postDeleteProduct
);

module.exports = router;
