const express = require("express");
const { Router } = require("express");
const router = Router();
const Follow = require("../models/follow");
const User = require("../models/userModel");
const auth = require("../middleware/auth");

router.post("/follow", auth, async (req, res) => {
  const user = req.user;
  const { followingId } = req.body;

  if (user.id === followingId) {
    return res.status(400).send("Kendi kendini takip edemezsin.");
  }

  try {
    // Kullanıcılar mevcut mu kontrol et
    const following = await User.findByPk(followingId);
    if (!following) {
      return res
        .status(404)
        .send("Takip edilmek istenen kullanıcı bulunamadı.");
    }

    // Zaten takip ediyor mu kontrol et
    const existingFollow = await Follow.findOne({
      where: { followerId: user.id, followingId },
    });

    if (existingFollow) {
      return res.status(409).send("Bu kullanıcıyı zaten takip ediyorsunuz.");
    }

    // Takip et
    await Follow.create({ followerId: user.id, followingId });
    return res.status(200).send("Kullanıcı başarıyla takip edildi.");
  } catch (error) {
    return res.status(500).send("Sunucu hatası: " + error.message);
  }
});

router.post("/unfollow", auth, async (req, res) => {
  const user = req.user;
  const { followingId } = req.body;

  try {
    // Takip kaydı var mı kontrol et
    const followRecord = await Follow.findOne({
      where: { followerId: user.id, followingId },
    });

    if (!followRecord) {
      return res.status(404).send("Takip kaydı bulunamadı.");
    }

    // Takipten çık
    await followRecord.destroy();
    return res.status(200).send("Takipten çıkıldı.");
  } catch (error) {
    return res.status(500).send("Sunucu hatası: " + error.message);
  }
});

// Kullanıcının takip ettikleri
router.get("/following/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const following = await Follow.findAll({
      where: { followerId: id },
      include: [{ model: User, as: "Following" }],
    });

    return res.status(200).json(following);
  } catch (error) {
    return res.status(500).send("Sunucu hatası: " + error.message);
  }
});

// Kullanıcının takipçileri
router.get("/:id/followers", async (req, res) => {
  const { id } = req.params;

  try {
    const followers = await Follow.findAll({
      where: { followingId: id },
      include: [{ model: User, as: "Followers" }],
    });

    return res.status(200).json(followers);
  } catch (error) {
    return res.status(500).send("Sunucu hatası: " + error.message);
  }
});

module.exports = router;
