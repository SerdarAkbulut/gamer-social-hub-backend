const { Router } = require("express");
const Post = require("../models/postModel");
const auth = require("../middleware/auth");
const router = Router();
const FavoritedGames = require("../models/favoritedGames");
const replyPost = require("../models/replyModel");
const { User } = require("../models/userModel");
const { Op } = require("sequelize");
const UserPostFeatured = require("../models/UserPostFeatured");

// Yeni bir post oluşturur
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
// Tüm postları getirir
router.get("/post", async (req, res) => {
  try {
    const getAllPost = await Post.findAll({
      order: [["createdAt", "DESC"]], // createdAt'e göre azalan sıralama
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userName"],
        },
      ],
    });

    return res.json(getAllPost.map((p) => p.toJSON()));
  } catch (error) {
    return res.status(500).json({
      message: "Form bilgileri çekilemedi",
      error: error.message,
    });
  }
});
// Belirli bir postun detaylarını getirir
router.get("/post-details/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const getPost = await Post.findAll({
      where: { id: postId },
      include: [
        {
          model: replyPost,
          as: "replies",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["userName"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["userName"],
        },
      ],
    });
    return res.status(200).json(getPost);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
// Belirli bir oyuna ait postları getirir
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
// Kullanıcının favori oyunlarını getir
router.get("/favoritedGamesPost", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Giriş yapıp favori oyunlarınızı seçin" });
    }

    // Kullanıcının favori oyunlarını al
    const getFavoritedGames = await FavoritedGames.findAll({
      where: { userId: user.id },
      attributes: ["gameId"],
    });

    // Eğer favori oyunları yoksa, boş bir array döndür
    if (!getFavoritedGames.length) {
      return res.json([]);
    }

    // Favori oyunlarının gameId'lerini listele
    const favoritedGameIds = getFavoritedGames.map((game) => game.gameId);

    // Favori oyunlara ait postları al
    const getFavoritedGamesPost = await Post.findAll({
      where: {
        gameId: { [Op.in]: favoritedGameIds },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userName"],
        },
      ],
    });

    // Kullanıcının favori oyun postlarını döndür
    return res.json(getFavoritedGamesPost);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// kullanıcının postları
router.get("/user-posts/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) {
      return res.status(500).json({ message: "Kullanıcı bulunamadı" });
    }
    const getUserPosts = await Post.findAll({
      where: { userId: userId },
      attributes: ["gameName", "gameId", "postTitle", "postText", "userId"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userName"],
        },
      ],
    });
    return res.status(200).json(getUserPosts);
  } catch (error) {}
});

// yorum ekle
router.post("/add-reply", auth, async (req, res) => {
  try {
    const user = req.user;
    const { postId, reply } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Önce giriş yapmalısınız" });
    }
    if (!postId) {
      return res
        .status(400)
        .json({ message: "Yorum yapılmak istenilen forum bulunamadı" });
    }
    if (!reply) {
      return res.status(400).json({ message: "Yorum alanı boş olamaz" });
    }

    // Eğer replyPost bir Mongoose modeli ise, aşağıdaki gibi kullanılmalıdır
    const newReply = new ReplyModel({
      postId,
      userId: user.id,
      reply,
    });

    await newReply.save();

    return res.status(201).json({
      message: "İşlem başarıyla gerçekleşti",
    });
  } catch (error) {
    console.error("Hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası, tekrar deneyin." });
  }
});

router.post("/feature-post", auth, async (req, res) => {
  const userId = req.user.id; // Varsayılan olarak giriş yapan kullanıcının ID'sini alıyoruz
  const { postId } = req.body;

  if (!postId) return res.status(404).send({ message: "Post ID sağlanmadı!" });

  try {
    // Mevcut öneriyi kontrol et
    const existingFeature = await UserPostFeatured.findOne({
      where: {
        userId: userId,
        postId: postId,
      },
    });

    if (existingFeature) {
      await UserPostFeatured.destroy({
        where: {
          userId: userId,
          postId: postId,
        },
      });
      return res
        .status(200)
        .send({ message: "Öne çıkarılanlardan kaldırıldı" });
    } else {
      await UserPostFeatured.create({ userId, postId });

      return res.status(200).send({ message: "Post öne çıkarıldı!" });
    }
  } catch (error) {
    console.error("Sunucu hatası:", error);
    res.status(500).send({ message: "Sunucu hatası!", error });
  }
});
module.exports = router;
