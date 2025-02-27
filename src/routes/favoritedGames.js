const express = require("express");
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const router = Router();
const auth = require("../middleware/auth");
const FavoritedGames = require("../models/favoritedGames");
const { where } = require("sequelize");
const favoritedGames = require("../models/favoritedGames");

router.post("/gameFavorite", auth, async (req, res) => {
  try {
    const user = req.user;
    const { gameId, gameName, gameImage, isFavorited } = req.body;
    if (!gameId || !gameName || !gameImage || !isFavorited) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur!" });
    }
    if (!user) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }
    const existingFavorite = await FavoritedGames.findOne({
      where: { gameId, userId: user.id },
    });
    if (existingFavorite) {
      existingFavorite.isFavorited = isLiked;
      await existingLike.save();
      return res.status(200).json({
        message: "Favori güncellendi",
      });
    }
    const newFavoritedGame = new favoritedGames({
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
    console.error("hata", error);
    return res.status(500).json({ message: "Sunucu Hatası", error });
  }
});
module.exports = router;
