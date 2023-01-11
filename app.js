const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
// const https = require("https");

const errorController = require("./controllers/error");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const loginRoutes = require("./routes/auth");

const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

//Middlewares

app.use(express.static(path.join(__dirname, "/public")));
app.use("/images", express.static(path.join(__dirname, "/images")));

const MONGO_URI = `mongodb+srv://quingsley:${process.env.MONGO_DB_PASSWORD}@cluster0.hkxyhxj.mongodb.net/${process.env.MONGO_DEFAULT_DB}?retryWrites=true`;

const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: "sessions",
}); // storing session in a session store

const fileStorage = multer.diskStorage({
  destination: (request, file, cb) => {
    cb(null, "images");
  },
  filename: (request, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname.replaceAll(" ", ""));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: "my secret key",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(flash());

const csrfProtection = csrf();
app.use(csrfProtection);

app.use((request, response, next) => {
  response.locals.isAuthenticated = request.session.isLoggedIn;
  response.locals.csrfToken = request.csrfToken();
  next();
});

app.use(async (request, response, next) => {
  try {
    if (!request.session.user) return next();
    const user = await User.findById(request.session.user._id);
    if (!user) {
      next();
    }
    request.user = user;
    next();
  } catch (error) {
    next(new Error(error));
  }
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(loginRoutes);
app.get("/500", errorController.get500page);
app.use(errorController.get404page);
app.use((error, request, response, next) => {
  // response.redirect("/500");
  console.error("ERROR", error);
  response.status(500).render("500", {
    docTitle: "Error",
    path: "/500",
    isAuthenticated: request.session.isLoggedIn,
  });
});

async function main() {
  try {
    const connection = await mongoose.connect(MONGO_URI);

    if (connection) {
      app.listen(process.env.PORT || 3000, () => {
        console.log("Server Running a http://localhost:3000");
      });

      // https
      //   .createServer({ key: privateKey, cert: certificate }, app)
      //   .listen(3000, () => {
      //     console.log("Server Running a https://localhost:3000");
      //   });
    }
  } catch (error) {
    console.log(error); //TODO fix error
  }
}

main();
