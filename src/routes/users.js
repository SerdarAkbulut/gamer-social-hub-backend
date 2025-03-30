const express = require("express");
const { Router } = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs"); // bcryptjs kullanımı
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const {
  User,
  validateRegister,
  validateUpdateUser,
} = require("../models/userModel");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth ");
const Follow = require("../models/follow");
const { default: axios } = require("axios");
const multer = require("multer");
const router = Router();
require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FormData = require("form-data");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const generateResetToken = (userId) => {
  const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  }); // 1 saat geçerli
  return resetToken;
};
const generateResetLink = (token) => {
  return `http://localhost:3002/reset-password?token=${token}`; // Frontend URL'inizi burada kullanın
};
const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // Token geçerli mi?
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { error: "Bu bağlantının süresi dolmuş. Lütfen tekrar deneyin." };
    }
    return { error: "Geçersiz veya bozuk token." };
  }
};

router.post("/register", async (req, res) => {
  const { error } = validateRegister(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  let user = await User.findOne({
    where: {
      [Op.or]: [{ email: req.body.email }, { userName: req.body.userName }],
    },
  });
  if (user) {
    return res.status(409).send({
      error: "conflict",
      message: "E-posta veya kullanıcı adı zaten kayıtlı",
    });
  }

  user = new User({
    userName: req.body.userName,
    email: req.body.email,
    password: hashedPassword,
  });

  // Kullanıcıyı veritabanına kaydetme
  await user.save();
  return res.status(200).send("Kayıt İşlemi Başarılı");
});

router.get("/user/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user ? req.user.id : null; // Giriş yapmış kullanıcıyı al

  let user = await User.findOne({
    where: {
      id: id,
    },
    attributes: ["userName", "id", "banner", "profileImage"],
  });

  if (!user) {
    return res.status(404).send("Kullanıcı Bulunamadı");
  }

  // Eğer giriş yapmış bir kullanıcı varsa, takip ilişkisini kontrol et
  let isFollowing = false;
  if (loggedInUserId) {
    const follow = await Follow.findOne({
      where: {
        followerId: loggedInUserId,
        followingId: id,
      },
    });
    isFollowing = follow ? true : false;
  }

  return res.status(200).json({
    user,
    isFollowing, // Takip durumu ekleniyor
  });
});
router.post("/login", async (req, res) => {
  try {
    let user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return res.status(409).send("Böyle bir email kaydı bulunamadı");
    }

    const isSuccess = await bcrypt.compare(req.body.password, user.password);
    if (!isSuccess) {
      return res.status(409).send("Şifre hatalı");
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, {
      // .env'den al
      expiresIn: "30d",
    });

    return res.header("Authorization", token).json({ token });
  } catch (error) {
    return res.status(500).send("Sunucu hatası: " + error.message);
  }
});

router.put("/user", auth, async (req, res) => {
  // Validasyon kontrolü
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Kullanıcıyı bulma
  const user = await User.findOne({
    where: { id: req.user.id },
  });

  if (!user) {
    return res.status(404).send("Kullanıcı bulunamadı");
  }

  // Eğer yeni şifre gönderildiyse, mevcut şifreyi doğrula
  if (req.body.password && req.body.password.trim() !== "") {
    if (!req.body.currentPassword) {
      return res
        .status(400)
        .send("Şifre değiştirmek için mevcut şifreyi girin");
    }

    const isMatch = await bcrypt.compare(
      req.body.currentPassword,
      user.password
    );
    if (!isMatch) {
      return res.status(400).send("Mevcut şifre hatalı");
    }

    // Yeni şifreyi hashleyip güncelle
    user.password = await bcrypt.hash(req.body.password, 10);
  }

  // Diğer alanları güncelle
  user.userName = req.body.userName || user.userName;
  user.email = req.body.email || user.email;

  // Güncellenen kullanıcıyı kaydetme
  try {
    await user.save();
    res.status(200).send("Kullanıcı başarıyla güncellendi");
  } catch (err) {
    console.error(err);
    res.status(500).send("Sunucu hatası");
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ where: { email: email } });

  if (!user) {
    return res.status(404).send({ message: "Girilen email kaydı bulunamadı" });
  }

  try {
    // Şifre sıfırlama token'ını oluştur
    const resetToken = generateResetToken(user.id);

    // Şifre sıfırlama linkini oluştur
    const resetLink = generateResetLink(resetToken);

    // Nodemailer transporter ayarları
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAILJS_USER,
        pass: process.env.EMAILJS_PASSWORD,
      },
    });

    // Mail gönderme ayarları
    const mailOptions = {
      from: process.env.EMAILJS_USER,
      to: email,
      subject: "Şifre Sıfırlama",
      text: `Şifrenizi sıfırlamak için şu bağlantıya tıklayın: ${resetLink}`,
      html: `<b>Şifrenizi sıfırlamak için şu bağlantıya tıklayın:</b> <a href="${resetLink}">${resetLink}</a>`,
    };

    // Mail gönderme işlemi
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res
          .status(500)
          .send({ message: "E-posta gönderilirken bir hata oluştu." });
      }

      return res
        .status(200)
        .send({ message: "Şifre sıfırlama linki mail adresinize gönderildi" });
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "E-posta gönderilirken bir hata oluştu." });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const decoded = verifyResetToken(token);

  if (decoded.error) {
    return res.status(400).json({ message: decoded.error });
  }

  // Token geçerliyse kullanıcıyı bul ve şifresini güncelle
  const user = await User.findOne({ where: { id: decoded.userId } });

  if (!user) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  // Yeni şifreyi hashleyerek güncelle
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({ message: "Şifreniz başarıyla güncellendi!" });
});

router.get("/check-reset-password-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({ valid: true, userId: decoded.userId });
  } catch (error) {
    res.status(400).json({
      valid: false,
      message:
        "Bağlantı linkinin süresi dolmuş yeniden bağlantı linki isteyin   ",
    });
  }
});

// R2 ayarlarını yapılandırın
const s3Client = new S3Client({
  region: "auto", // R2 bölgesi
  endpoint:
    "https://6fb8199f7e77311de57e242a70bc8da9.r2.cloudflarestorage.com/user-banner", // R2 endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID, // R2 Access Key ID
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY, // R2 Secret Access Key
  },
});

router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Lütfen bir resim yükleyin" });
    }

    // R2'ye yükleme işlemi
    const bucketName = "<user-banner>"; // R2 bucket adı
    const fileName = uuidv4();
    const fileBuffer = req.file.buffer; // Dosya verisi

    // PutObjectCommand ile dosyayı yükleyin
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);

    const uploadResponse = await s3Client.send(command);

    // Yükleme başarılı ise URL'yi döndür
    const fileUrl = `https://${bucketName}.r2.cloudflarestorage.com/${fileName}`;
    return res.status(200).json({ imageUrl: fileUrl });
  } catch (error) {
    console.error("Resim yükleme hatası:", error.message || error);
    return res
      .status(500)
      .json({ message: "Resim yükleme başarısız", error: error.message });
  }
});
module.exports = router;
