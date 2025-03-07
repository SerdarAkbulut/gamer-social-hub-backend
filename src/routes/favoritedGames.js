const express = require("express");
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const router = Router();
const auth = require("../middleware/auth");
const FavoritedGames = require("../models/favoritedGames");
const { where } = require("sequelize");

router.post("/favoriGames", auth, async (req, res) => {
  try {
    const user = req.user;
    const { gameId, gameName, gameImage, isFavorited } = req.body;

    // False gelirse hata almamak için kontrolü düzelttik
    if (!gameId || !gameName || !gameImage || isFavorited === undefined) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur!" });
    }

    if (!user) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }

    const existingFavorite = await FavoritedGames.findOne({
      where: { gameId, userId: user.id },
    });

    if (existingFavorite) {
      existingFavorite.isFavorited = isFavorited; // Hatalı değişken düzeltildi
      await existingFavorite.save();
      return res.status(200).json({
        message: "Favori güncellendi",
      });
    }

    const newFavoritedGame = new FavoritedGames({
      // Model ismi düzeltildi
      gameId,
      gameName,
      gameImage,
      isFavorited,
      userId: user.id,
    });

    await newFavoritedGame.save();
    return res.status(200).json({
      message: "Favorilere eklendi",
    });
  } catch (error) {
    console.error("Hata:", error);
    return res.status(500).json({ message: "Sunucu Hatası", error });
  }
});
router.get("/favoritedGames", auth, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401, "Giriş Yapılmadı");
  }
  try {
    const favoritedGames = await FavoritedGames.findAll({
      where: { userId: user.id, isFavorited: true },
    });
    return res.status(200).json(favoritedGames);
  } catch (error) {
    return res.status(400, error);
  }
});

router.get("/userFavoritedGames/:userId", async (req, res) => {
  const { userId } = req.params;

  // userId kontrolü
  if (!userId) {
    return res.status(400).json({ error: "Kullanıcı bulunamadı" });
  }

  try {
    const favoritedGames = await FavoritedGames.findAll({
      where: { userId: parseInt(userId) }, // userId'yi Integer'a çevir
    });

    return res.status(200).json(favoritedGames);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
