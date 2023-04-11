const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
// const https = require("https");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const loginRoutes = require("./routes/auth");

const app = express();

const MONGO_URI = `mongodb+srv://quingsley:${process.env.MONGO_DB_PASSWORD}@cluster0.hkxyhxj.mongodb.net/${process.env.MONGO_DEFAULT_DB}?retryWrites=true`;

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyParser.json());
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(loginRoutes);
app.use((error, request, response, next) => {
  console.error("ERROR", error);
  response.status(500).json({ error: error });
});

async function main() {
  try {
    const connection = await mongoose.connect(MONGO_URI);

    if (connection) {
      app.listen(process.env.PORT || 8080, () => {
        console.log(`Server Running on port ${process.env.PORT || 8080}`);
      });
    }
  } catch (error) {
    console.log(error); //TODO fix error
  }
}

main();
