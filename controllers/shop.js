const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const Product = require("../models/product");
const Order = require("../models/order");
const errorHandler = require("../utils/errorhandler");

const ITEMS_PER_PAGE = 2;
const pagination = async (request) => {
  const page = +request.query.page || 1;
  try {
    const itemCount = await Product.countDocuments();
    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    const currentPage = page;
    const hasNextPage = ITEMS_PER_PAGE * page < itemCount;
    const hasPreviousPage = page > 1;
    const nextPage = page + 1;
    const previousPage = page - 1;
    const lastPage = Math.ceil(itemCount / ITEMS_PER_PAGE);
    return {
      products: products,
      currentPage: currentPage,
      hasNextPage: hasNextPage,
      hasPreviousPage: hasPreviousPage,
      nextPage: nextPage,
      previousPage: previousPage,
      lastPage: lastPage,
    };
  } catch (error) {
    throw error;
  }
};

exports.getProducts = async (request, response, next) => {
  try {
    const paginationResult = await pagination(request);
    if (paginationResult.products) {
      return response.status(200).json({ ...paginationResult });
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getProductsDetail = async (request, response, next) => {
  const prodId = request.params.productId;
  try {
    const product = await Product.findById(prodId);
    response.status(200).json({ product });
  } catch (error) {
    errorHandler(error, next);
  }
};
exports.getIndex = async (request, response, next) => {
  try {
    const paginationResult = await pagination(request);
    if (paginationResult.products) {
      response.status(200).json({ ...paginationResult });
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

//made it a post request so as to attach token on the header
exports.getCart = async (request, response, next) => {
  try {
    const data = await request.user.populate("cart.items.productId");
    response.status(200).json({ cartItems: data.cart });
  } catch (error) {
    errorHandler(error, next);
  }
};
exports.postCart = async (request, response, next) => {
  const productId = request.body.productId;
  try {
    const currentProduct = await Product.findById(productId);
    const user = request.user; //USER INSTANCE HAVING METHODS
    const addingToCart = await user.addToCart(currentProduct);
    if (addingToCart) {
      response
        .status(201)
        .json({ message: "Items added to cart successfully" });
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.deleteCartProduct = async (request, response, next) => {
  const productId = request.body.productId;
  try {
    const result = await request.user.removeFromCart(productId);
    if (result) {
      response
        .status(200)
        .json({ message: "Product deleted Successfully from cart" });
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getCheckout = async (request, response, next) => {
  try {
    const data = await request.user.populate("cart.items.productId");
    const total = data.cart.items.reduce((acc, prod) => {
      return (acc += prod.quantity * prod.productId.price);
    }, 0);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: data.cart.items.map((p) => {
        return {
          quantity: p.quantity,
          price_data: {
            currency: "usd",
            unit_amount: p.productId.price * 100,
            product_data: {
              name: p.productId.title,
              description: p.productId.description,
            },
          },
        };
      }),
      success_url: `${request.protocol}://${request.get(
        "host"
      )}/checkout/success`,
      cancel_url: `${request.protocol}://${request.get(
        "host"
      )}/checkout/cancel`,
      customer_email: request.user.email,
    });

    if (session) {
      response.status(200).json({
        cart: data.cart.items,
        total: total,
        stripePublishKey: process.env.STRIPE_PUBLISH_KEY,
        sessionId: session.id,
      });
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

//swithced to post to attach token to header
exports.getOrders = async (request, response, next) => {
  try {
    const orders = await Order.find({
      "user.userId": request.user._id,
    });
    response.status(200).json({ orders });
  } catch (error) {
    errorHandler(error, next);
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
      user: { email: user.email, userId: user },
    });

    const result = await order.save();

    if (result) {
      const clearCart = await user.clearCart();
      if (clearCart) {
        response
          .status(200)
          .json({ message: "Order Processed and Cart cleared Successfully" });
      }
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

//Attach token to header hence switch to post request
//TODO: Test by simply hitting the endpoint on client or either figure if could upload file to a bucket?
exports.getInvoice = async (request, response, next) => {
  const orderId = request.params.orderId;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new Error("No Order Found"));
    }
    if (order.user.userId.toString() !== request.user._id.toString()) {
      return next(new Error("Not Authorized"));
    }
    const invoiceName = "invoice" + "-" + orderId + ".pdf";
    const p = path.join("data", "invoices", invoiceName);
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(p));
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `inline; filename=${invoiceName}`
    );
    pdfDoc.pipe(response);
    pdfDoc.fontSize(16).text("Invoice", { underline: true });
    pdfDoc
      .moveTo(pdfDoc.x, pdfDoc.y)
      .lineTo(pdfDoc.page.width, pdfDoc.y)
      .stroke();
    const products = order.products.map((prod) => prod.product.title);
    const prices = order.products.map((prod) => prod.product.price);
    const quantities = order.products.map((prod) => prod.quantity);

    // Calculate the total sum of the products
    const total = products.reduce(
      (acc, product, i) => acc + prices[i] * quantities[i],
      0
    );

    // Set the font for the table cells
    pdfDoc.font("Helvetica");

    // Add the table header
    pdfDoc.text("Product", { align: "left" });
    pdfDoc.text("Price", { align: "center" });
    pdfDoc.text("Quantity", { align: "right" });
    pdfDoc.moveDown();

    // Add a line below the table header
    pdfDoc
      .moveTo(pdfDoc.x, pdfDoc.y)
      .lineTo(pdfDoc.page.width, pdfDoc.y)
      .stroke();

    for (let i = 0; i < products.length; i++) {
      pdfDoc.text(products[i], { align: "left" });
      pdfDoc.text(prices[i].toString(), { align: "center" });
      pdfDoc.text(quantities[i], { align: "right" });
      pdfDoc.moveDown();
    }

    pdfDoc
      .moveTo(pdfDoc.x, pdfDoc.y)
      .lineTo(pdfDoc.page.width, pdfDoc.y)
      .stroke();

    // Add the total row
    pdfDoc.text("Total: ", { align: "right" });
    pdfDoc.moveDown();
    pdfDoc.text("$ " + total.toString(), { align: "right" });

    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};
