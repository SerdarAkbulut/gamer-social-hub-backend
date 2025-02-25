const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.header("Authorization"); // Authorization header'ı al
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Yetkiniz yok, token gerekli" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer tokenDeğeri" formatını ayır
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(400).json({ message: "Hatalı veya süresi dolmuş token" });
  }
};

module.exports = auth;
