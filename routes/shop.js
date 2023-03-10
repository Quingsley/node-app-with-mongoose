const express = require("express");

const shopProductsController = require("../controllers/shop");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get("/", shopProductsController.getIndex);
router.get("/products", shopProductsController.getProducts);
router.get(
  "/product-detail/:productId",
  shopProductsController.getProductsDetail
);
router.get("/cart", isAuth, shopProductsController.getCart);
router.post("/cart", isAuth, shopProductsController.postCart);
router.post("/cart-delete", isAuth, shopProductsController.deleteCartProduct);
router.get("/checkout", isAuth, shopProductsController.getCheckout);
router.get("/checkout/success", shopProductsController.postOrders);
router.get("/checkout/cancel", shopProductsController.getCheckout);
router.get("/orders", isAuth, shopProductsController.getOrders);
router.post("/orders", isAuth, shopProductsController.postOrders);
router.get("/invoice/:orderId", isAuth, shopProductsController.getInvoice);

module.exports = router;
