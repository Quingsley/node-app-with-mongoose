const Product = require("../models/product");
const { validationResult } = require("express-validator");

const errorHandler = require("../utils/errorhandler");
const fileHelper = require("../utils/file");

exports.getAddProduct = (request, response, next) => {
  response.render("admin/edit-product", {
    docTitle: "Add-Product",
    path: "/admin/add-product",
    editing: false,
    errorMessage: null,
    hasErrors: false,
    validationErrors: [],
  });
};

exports.postAddProduct = async (request, response, next) => {
  const title = request.body.title;
  const description = request.body.description;
  const image = request.file;
  const price = request.body.price;
  if (!image) {
    return response.status(422).render("admin/edit-product", {
      docTitle: "Add-Product",
      path: "/admin/add-product",
      editing: false,
      hasErrors: true,
      errorMessage: "Attached file is not an image",
      validationErrors: [],
      product: {
        title: title,
        description: description,
        price: price,
      },
    });
  }

  const error = validationResult(request).errors;
  if (error.length > 0) {
    return response.status(422).render("admin/edit-product", {
      docTitle: "Add-Product",
      path: "/admin/add-product",
      editing: false,
      hasErrors: true,
      errorMessage: error[0].msg,
      validationErrors: error,
      product: {
        title: title,
        description: description,
        price: price,
      },
    });
  }
  const product = new Product({
    title: title,
    description: description,
    imageUrl: image.path,
    price: price,
    userId: request.session.user,
  });

  try {
    await product.save();

    response.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    errorHandler(error, next);
  }
};

exports.getProducts = async (request, response, next) => {
  try {
    const products = await Product.find({ userId: request.user._id });
    // .select("title price -_id")
    // .populate("userId", "name");

    // console.log(products);

    response.render("admin/products", {
      prods: products,
      docTitle: "Products",
      path: "/admin/products",
      errorMessage: null,
      hasErrors: false,
      validationErrors: [],
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.getEditProduct = async (request, response, next) => {
  let editMode = request.query.edit;
  const prodId = request.params.productId;
  if (!editMode) {
    return response.redirect("/");
  }

  editMode = editMode === "true";
  try {
    const product = await Product.findById(prodId);
    if (!product) {
      response.redirect("/");
    }
    response.render("admin/edit-product", {
      docTitle: "Edit Product 📝",
      path: "/edit-product",
      editing: editMode,
      product: product,
      errorMessage: null,
      hasErrors: false,
      validationErrors: [],
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postEditProduct = async (request, response, next) => {
  const prodId = request.body.productId;
  const updatedTitle = request.body.title;
  const updatedImage = request.file;
  const updatedPrice = request.body.price;
  const updatedDesc = request.body.description;
  try {
    const product = await Product.findById(prodId);

    if (product.userId.toString() !== request.user._id.toString()) {
      return response.redirect("/");
    }
    const error = validationResult(request).errors;
    if (error.length > 0) {
      return response.status(422).render("admin/edit-product", {
        docTitle: "Edit Product 📝",
        path: "/edit-product",
        editing: true,
        hasErrors: true,
        errorMessage: error[0].msg,
        product: {
          title: updatedTitle,
          description: updatedDesc,
          price: updatedPrice,
          _id: prodId,
        },
        validationErrors: error,
      });
    }

    product.title = updatedTitle;
    product.description = updatedDesc;
    product.price = updatedPrice;
    if (updatedImage) {
      fileHelper(product.imageUrl);
      product.imageUrl = updatedImage.path;
    }
    const res = await product.save();

    if (res) {
      response.redirect("/admin/products");
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
      fileHelper(product.imageUrl);
      const result = await Product.deleteOne({
        _id: prodId,
        userId: request.user._id,
      });

      if (result) {
        // response.redirect("/admin/products");
        response.status(200).json({ message: "Product deleted Successfully" });
      }
    }
  } catch (error) {
    // errorHandler(error, next);
    response.status(500).json({ message: "Product deletion failed" });
  }
};
