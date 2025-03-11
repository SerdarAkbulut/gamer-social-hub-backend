const { Router } = require("express");
const Post = require("../models/postModel");
const auth = require("../middleware/auth");
const router = Router();
const FavoritedGames = require("../models/favoritedGames");
const User = require("../models/userModel");

router.post("/newpost", auth, async (req, res) => {
  try {
    const user = req.user;
    const { gameId, gameName, postTitle, postText } = req.body;
    if ((!gameId, !gameName, !postTitle, !postText)) {
      return res.status(400).json({ message: "Tüm alanları doldurun" });
    }
    if (!user) {
      return res.status(401).json({ message: "Giriş yapmalısınız" });
    }

    const newPost = new Post({
      gameId,
      gameName,
      postText,
      postTitle,
      userId: user.id,
    });
    await newPost.save();
    return res.status(200).json({
      message: "işlem başarıyla gerçekleşti",
    });
  } catch (error) {
    return res.status(500).json({ message: "Sunucu Hatası", error });
  }
});
router.get("/post", async (req, res) => {
  try {
    const getAllPost = await Post.findAll(); // await burada olmalı
    return res.json(getAllPost.map((p) => p.toJSON())); // JSON formatında döndür
  } catch (error) {
    return res.status(500).json({
      message: "Form bilgileri çekilemedi",
      error: error.message,
    });
  }
});
router.post("/gameposts", async (req, res) => {
  try {
    const gameId = parseInt(req.query.gameId, 10);
    if (isNaN(gameId)) {
      return res.status(400).json({ message: "Geçersiz gameId" });
    }
    const getGamePosts = await Post.findAll({ where: { gameId: gameId } });
    if (!getGamePosts) {
      return res.json("post yok");
    }
    return res.json(
      getGamePosts.length ? getGamePosts.map((gp) => gp.toJSON()) : []
    );
  } catch (error) {
    console.error("Hata:", error.message);
    return res.status(500).json({
      message: "Form bilgileri çekilemedi",
      error: error.stack, // Detaylı hata bilgisi
    });
  }
});

router.get("/favoritedGamesPost", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Giriş yapıp favori oyunlarınızı seçin" });
    }

    const getFavoritedGames = await FavoritedGames.findAll({
      where: { userId: user.id },
      attributes: ["gameId"],
    });

    const favoritedGameIds = getFavoritedGames.map((game) => game.gameId);

    const getFavoritedGamesPost = await Post.findAll({
      where: { userId: user.id, gameId: favoritedGameIds },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userName"],
        },
      ],
    });

    return res.json(getFavoritedGamesPost);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
