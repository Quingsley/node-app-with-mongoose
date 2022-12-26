const express = require("express");
const path = require("path");

const adminProductsController = require("../controllers/admin");

const router = express.Router();

router.get("/add-product", adminProductsController.getAddProduct);

router.post("/add-product", adminProductsController.postAddProduct);

router.get("/products", adminProductsController.getProducts);

router.get("/edit-product/:productId", adminProductsController.getEditProduct);

router.post("/edit-product", adminProductsController.postEditProduct);

router.post("/delete-product", adminProductsController.postDeleteProduct);

module.exports = router;
