const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const errorController = require("./controllers/error");
const PASSWORD = require("./utils/password");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

//Middlewares
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "/public")));

app.use(async (request, response, next) => {
  try {
    const user = await User.findById("63a95f43874be80007ed4584");
    if (!user) {
      response.redirect("/404");
    }
    request.user = user;
    next();
  } catch (error) {
    console.log(error);
  }
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404page);

async function main() {
  try {
    const connection = await mongoose.connect(
      `mongodb+srv://quingsley:${PASSWORD}@cluster0.hkxyhxj.mongodb.net/shop-1?retryWrites=true`
    );

    if (connection) {
      app.listen(3000, async () => {
        const isUserAvailable = await User.findOne();
        if (!isUserAvailable) {
          const user = new User({
            name: "Jerome",
            email: "test@test.com",
            cart: { items: [] },
          });
          const result = await user.save();
          if (result) {
            console.log("Server Running a http://localhost:3000");
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}

main();
