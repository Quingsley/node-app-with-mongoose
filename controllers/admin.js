const Product = require("../models/product");
const { validationResult } = require("express-validator");
const errorHandler = require("../utils/errorhandler");

exports.postAddProduct = async (request, response, next) => {
  const title = request.body.title;
  const description = request.body.description;
  const image = request.body.imageUrl;
  const price = request.body.price;
  const error = validationResult(request).errors;
  if (error.length > 0) {
    response.status(422).json({
      message: error[0].msg,
      errors: error,
    });
  }
  const product = new Product({
    title: title,
    description: description,
    imageUrl: image,
    price: price,
    userId: request.session.user,
  });

  try {
    await product.save();
    response.status(201).json({ product });
  } catch (error) {
    console.log(error);
    errorHandler(error, next);
  }
};

exports.getProducts = async (request, response, next) => {
  try {
    const products = await Product.find({ userId: request.user._id });
    response.status(200).json({ products });
  } catch (error) {
    errorHandler(error, next);
  }
};
exports.postEditProduct = async (request, response, next) => {
  const prodId = request.body.productId;
  const updatedTitle = request.body.title;
  const updatedImage = request.body.imageUrl;
  const updatedPrice = request.body.price;
  const updatedDesc = request.body.description;
  try {
    const product = await Product.findById(prodId);

    if (product.userId.toString() !== request.user._id.toString()) {
      return response.status(401).json({ message: "Not authorized" });
    }
    const error = validationResult(request).errors;
    if (error.length > 0) {
      response.status(422).json({
        message: error[0].msg,
        errors: error,
      });
    }

    product.title = updatedTitle;
    product.description = updatedDesc;
    product.price = updatedPrice;
    product.imageUrl = updatedImage;

    const res = await product.save();

    if (res) {
      response
        .status(200)
        .json({ product, message: "Product updated Successfully" });
    }
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.deleteProduct = async (request, response, next) => {
  const prodId = request.params.productId;

  try {
    const product = await Product.findById(prodId);
    if (!product) {
      throw new Error("No Product Found");
    }
    if (product) {
      const result = await Product.deleteOne({
        _id: prodId,
        userId: request.user._id,
      });
      console.log(result);
      if (result) {
        response.status(200).json({ message: "Product deleted Successfully" });
      }
    }
  } catch (error) {
    response.status(500).json({ message: "Product deletion failed" });
  }
};
