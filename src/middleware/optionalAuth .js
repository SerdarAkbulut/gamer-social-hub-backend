const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
      req.user = decodedToken; // Token geçerliyse req.user'e at
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Hatalı veya süresi dolmuş token" });
    }
  } else {
    req.user = null; // Token yoksa kullanıcı giriş yapmamış say
  }

  next();
};

module.exports = optionalAuth;
