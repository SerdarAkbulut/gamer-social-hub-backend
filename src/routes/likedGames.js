const express = require("express");
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const router = Router();
const auth = require("../middleware/auth");
const LikedGames = require("../models/likedGames");
const { where, Op } = require("sequelize");
const User = require("../models/userModel");
const favoritedGames = require("../models/favoritedGames");

router.post("/gameLike", auth, async (req, res) => {
  try {
    const user = req.user; // Middleware'den gelen kullanıcı
    const { gameId, gameName, gameImage, isLiked } = req.body;

    if (!gameId || !gameName || !gameImage || isLiked === undefined) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur!" });
    }
    if (!user) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }
    // Kullanıcının bu oyun için beğeni kaydı var mı kontrol et
    const existingLike = await LikedGames.findOne({
      where: { gameId, userId: user.id },
    });

    if (existingLike) {
      if (existingLike.isLiked === isLiked) {
        // Eğer aynı değer geldiyse `isLiked: null` olarak güncelle
        existingLike.isLiked = null;
        await existingLike.save();
        return res.status(200).json({
          message: "Beğeni sıfırlandı!",
          likedGame: existingLike,
        });
      } else {
        // Eğer farklı bir değer geldiyse, yeni değeri güncelle
        existingLike.isLiked = isLiked;
        await existingLike.save();
        return res.status(200).json({
          message: "Beğeni güncellendi!",
          likedGame: existingLike,
        });
      }
    }

    // Kullanıcı daha önce bu oyunu hiç beğenmemişse yeni kayıt oluştur
    const newLikedGame = new LikedGames({
      gameId,
      gameName,
      gameImage,
      isLiked,
      userId: user.id, // Kullanıcı ile ilişkilendir
    });

    await newLikedGame.save();

    return res.status(200).json({
      message: "Oyun başarıyla beğenildi!",
      likedGame: newLikedGame,
    });
  } catch (error) {
    console.error("Hata:", error);
    return res.status(500).json({ message: "Sunucu hatası", error });
  }
});
router.get("/likedGames", auth, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Giriş Yapılmadı" });
  }
  try {
    const likedGames = await LikedGames.findAll({
      where: {
        userId: user.id, // Kullanıcı ID'sini doğru şekilde al
        isLiked: { [Op.or]: [true, false] },
      },
      attributes: [
        ["gameImage", "cover_url"], // gameImage'i cover_url olarak al
        ["gameName", "name"],
        "gameId",
        "isLiked",
      ],
    });
    return res.status(200).json(likedGames); // JSON formatında veri gönder
  } catch (error) {
    return res.status(400).json({ message: error.message }); // Hata mesajını düzgün şekilde gönder
  }
});

router.get("/userLikedGames/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Kullanıcı bulunamadı" });
  }

  try {
    // Kullanıcının beğendiği oyunları getir
    const likedGames = await LikedGames.findAll({
      where: {
        userId: userId,
        isLiked: { [Op.or]: [true, false] },
      },
      attributes: [
        ["gameImage", "cover_url"], // gameImage'i cover_url olarak al
        ["gameName", "name"],
        "gameId",
        "isLiked",
      ],
    });

    // Favori oyunları getir (Kullanıcıya ait favoritedGames kayıtları)
    const favoritedGamesList = await favoritedGames.findAll({
      where: { userId: userId },
      attributes: ["gameId", "isFavorited"], // Sadece gameId ve isFavorited bilgilerini al
    });

    // Favori oyunları bir obje olarak map'le (Hızlı erişim için)
    const favoritedMap = {};
    favoritedGamesList.forEach((fav) => {
      favoritedMap[fav.gameId] = fav.isFavorited;
    });

    // Beğenilen oyunlara isFavorited ekle
    const enrichedLikedGames = likedGames.map((game) => ({
      ...game.toJSON(),
      isFavorited: favoritedMap[game.gameId] || false, // Eğer favoritedMap'te varsa, al; yoksa false yap
    }));

    return res.status(200).json(enrichedLikedGames);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
module.exports = router;
