const jwt = require("jsonwebtoken");
const protect = (req, res, next) => {
  let token;
  //console.log(req.headers.authorization.startsWith("Bearer "));

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // console.log(process.env.SecretKey)
      const decodedWithoutVerify = jwt.decode(token);
      console.log(
        "Decoded token without verification:",
        decodedWithoutVerify.userId
      );

      // const decoded = jwt.verify(token, process.env.SecretKey);
      // console.log(decodedWithoutVerify.userId)
      req.userId = decodedWithoutVerify.userId;
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
module.exports = { protect };
