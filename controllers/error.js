const path = require("../utils/path");

exports.get404page = (request, response, next) => {
  response.status(404).render("404", { docTitle: "404 ⚠️", path: null });
};
