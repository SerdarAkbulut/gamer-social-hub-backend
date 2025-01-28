const jwt = require("jsonwebtoken");
const config = require("config");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send("Yetkiniz yok");
  }
  try {
    const decodeToken = jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = decodeToken;
    next();
  } catch (ex) {
    res.status(400).send("Hatalı token");
  }
};

module.exports = auth;
