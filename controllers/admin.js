const Product = require("../models/product");

exports.getAddProduct = (request, response, next) => {
  response.render("admin/edit-product", {
    docTitle: "Add-Product",
    path: "/add-product",
    editing: false,
  });
};

exports.postAddProduct = async (request, response, next) => {
  const title = request.body.title;
  const description = request.body.description;
  const imageUrl = request.body.imageUrl;
  const price = request.body.price;
  const product = new Product({
    title: title,
    description: description,
    imageUrl: imageUrl,
    price: price,
    userId: request.user,
  });

  try {
    await product.save();

    response.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};
exports.getProducts = async (request, response, next) => {
  try {
    const products = await Product.find();
    // .select("title price -_id")
    // .populate("userId", "name");

    console.log(products);

    response.render("admin/products", {
      prods: products,
      docTitle: "Products",
      path: "/admin/products",
    });
  } catch (error) {
    console.log(error);
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
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postEditProduct = async (request, response, next) => {
  const prodId = request.body.productId.trim();
  const updatedTitle = request.body.title.trim();
  const updatedImageUrl = request.body.imageUrl.trim();
  const updatedPrice = request.body.price.trim();
  const updatedDesc = request.body.description.trim();
  try {
    const product = await Product.findById(prodId);
    product.title = updatedTitle;
    product.description = updatedDesc;
    product.imageUrl = updatedImageUrl;
    product.price = updatedPrice;
    const res = await product.save();

    if (res) {
      response.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

exports.postDeleteProduct = async (request, response, next) => {
  const prodId = request.body.productId;

  try {
    const result = await Product.findByIdAndRemove(prodId);

    if (result) {
      response.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};
