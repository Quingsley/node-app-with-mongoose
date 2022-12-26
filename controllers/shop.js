const Product = require("../models/product");
const Order = require("../models/order");

exports.getProducts = async (request, response, next) => {
  try {
    const products = await Product.find();
    if (products) {
      response.render("shop/product-list", {
        prods: products,
        docTitle: "All Products",
        path: "/products",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getProductsDetail = async (request, response, next) => {
  const prodId = request.params.productId;
  try {
    const product = await Product.findById(prodId);
    response.render("shop/product-detail", {
      docTitle: product.title,
      path: "/products",
      product: product,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getIndex = async (request, response, next) => {
  try {
    const products = await Product.find();
    if (products) {
      response.render("shop/index", {
        products: products,
        docTitle: "SHOP 🏪",
        path: "/",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getCart = async (request, response, next) => {
  try {
    const data = await request.user.populate("cart.items.productId");
    response.render("shop/cart", {
      docTitle: "Your Cart 🛒",
      path: "/cart",
      cart: data.cart.items,
    });
  } catch (error) {
    console.log(error);
  }
};
exports.postCart = async (request, response, next) => {
  const productId = request.body.productId;
  try {
    const currentProduct = await Product.findById(productId);
    const user = request.user; //USER INSTANCE HAVING METHODS
    const addingToCart = await user.addToCart(currentProduct);
    if (addingToCart) {
      response.redirect("/cart");
    }
  } catch (error) {
    console.error(error);
  }
};

exports.deleteCartProduct = async (request, response, next) => {
  const productId = request.body.productId;
  try {
    const result = await request.user.removeFromCart(productId);
    if (result) {
      response.redirect("/cart");
    }
  } catch (error) {
    console.error(error);
  }
};

exports.getOrders = async (request, response, next) => {
  try {
    const orders = await Order.find({ "user.userId": request.user._id });

    response.render("shop/orders", {
      docTitle: "Your Orders",
      path: "/orders",
      orders: orders,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postOrders = async (request, response, next) => {
  try {
    const user = request.user;
    const data = await user.populate("cart.items.productId");
    const products = data.cart.items.map((product) => {
      return {
        product: { ...product.productId._doc },
        quantity: product.quantity,
      };
    });

    const order = new Order({
      products: products,
      user: { name: user.name, userId: user },
    });

    const result = await order.save();

    if (result) {
      const clearCart = await user.clearCart();
      if (clearCart) {
        response.redirect("/orders");
      }
    }
  } catch (error) {
    console.log(error);
  }
};
