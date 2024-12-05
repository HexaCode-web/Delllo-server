const allowedOrigins = require("./allowedOrigins");
const corsOptions = {
  origin: (origin /* from the domain that made the request*/, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(
        null,
        true
      ); /* first parameter is the error and the second weather or not you want to allow it*/
    } else {
      callback(new Error("not allowed by cors", false));
    }
  },
  optionsSuccessStatus: 200,
};
module.exports = corsOptions;
