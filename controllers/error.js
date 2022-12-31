exports.get404page = (request, response, next) => {
  response.status(404).render("404", {
    docTitle: "404 ⚠️",
    path: null,
  });
};

exports.get500page = (request, response, next) => {
  response.status(500).render("500", {
    docTitle: "Error",
    path: "/500",
  });
};
