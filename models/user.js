const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

userSchema.methods.addToCart = async function (product) {
  try {
    const currentProductIndex = this.cart.items.findIndex(
      (cartProduct) =>
        cartProduct.productId.toString() === product._id.toString()
    );

    const updatedCartItems = [...this.cart.items];

    let newQuantity = 1;
    if (currentProductIndex >= 0) {
      //increase quantity
      newQuantity = this.cart.items[currentProductIndex].quantity + 1;
      updatedCartItems[currentProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: product._id,
        quantity: newQuantity,
      });
    }

    const updatedCart = {
      items: updatedCartItems,
    };

    this.cart = updatedCart;
    const result = await this.save();
    return result;
  } catch (error) {
    throw error;
  }
};

userSchema.methods.removeFromCart = async function (prodId) {
  try {
    const updatedCart = this.cart.items.filter(
      (item) => item.productId.toString() !== prodId.toString()
    );
    this.cart.items = updatedCart;
    const result = await this.save();
    return result;
  } catch (err) {
    throw err;
  }
};

userSchema.methods.clearCart = async function () {
  try {
    this.cart = { items: [] };
    return this.save();
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);
