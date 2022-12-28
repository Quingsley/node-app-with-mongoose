const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const errorController = require("./controllers/error");
const PASSWORD = require("./utils/password");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const loginRoutes = require("./routes/auth");

const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

//Middlewares
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "/public")));

const MONGO_URI = `mongodb+srv://quingsley:${PASSWORD}@cluster0.hkxyhxj.mongodb.net/shop-1?retryWrites=true`;

const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: "sessions",
}); // storing session in a session store

app.use(
  session({
    secret: "my secret key",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(async (request, response, next) => {
  try {
    if (!request.session.user) return next();
    const user = await User.findById(request.session.user._id);
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
app.use(loginRoutes);
app.use(errorController.get404page);

async function main() {
  try {
    const connection = await mongoose.connect(MONGO_URI);

    if (connection) {
      app.listen(3000, async () => {
        const isUserAvailable = await User.findOne();
        if (!isUserAvailable) {
          const user = new User({
            name: "Jerome",
            email: "test@test.com",
            cart: { items: [] },
          });
          await user.save();

          console.log("Server Running a http://localhost:3000");
        }
        console.log("Server Running a http://localhost:3000");
      });
    }
  } catch (error) {
    console.log(error);
  }
}

main();
