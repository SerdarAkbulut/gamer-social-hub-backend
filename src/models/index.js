const sequelize = require("../startup/db");
const { User } = require("./userModel");
const favoritedGames = require("./favoritedGames");
const LikedGames = require("./likedGames");
const Post = require("./postModel");
const replyPost = require("./replyModel");
const UserPostFeatured = require("./UserPostFeatured");
const Follow = require("./follow");
const SavedPost = require("./savedPost");

// Önerilen Postlar ilişkisi
User.belongsToMany(Post, {
  through: UserPostFeatured,
  foreignKey: "userId",
  as: "featuredPosts",
});
Post.belongsToMany(User, {
  through: UserPostFeatured,
  foreignKey: "postId",
  as: "featuredByUsers",
});

// Kullanıcı - FavoritedGames ilişkisi
User.hasMany(favoritedGames, { foreignKey: "userId", as: "favorites" });
favoritedGames.belongsTo(User, { foreignKey: "userId" });

// Kullanıcı - LikedGames ilişkisi
User.hasMany(LikedGames, { foreignKey: "userId", as: "liked" });
LikedGames.belongsTo(User, { foreignKey: "userId" });

// Kullanıcı - Post ilişkisi
User.hasMany(Post, { foreignKey: "userId", as: "userPosts" });
Post.belongsTo(User, { foreignKey: "userId", as: "user" });

// Kullanıcı - replyPost ilişkisi
User.hasMany(replyPost, { foreignKey: "userId", as: "userReply" });
replyPost.belongsTo(User, { foreignKey: "userId", as: "user" });

Post.hasMany(replyPost, { foreignKey: "postId", as: "replies" });
replyPost.belongsTo(Post, { foreignKey: "postId", as: "post" });

// Kullanıcı - Takip ilişkisi
User.hasMany(Follow, { foreignKey: "followerId", as: "followers" });
User.hasMany(Follow, { foreignKey: "followingId", as: "following" });

Follow.belongsTo(User, { foreignKey: "followerId", as: "follower" });
Follow.belongsTo(User, { foreignKey: "followingId", as: "followed" });

// Kullanıcı - Kaydedilen Post ilişkisi
User.hasMany(SavedPost, { foreignKey: "userId", as: "savedPosts" });
SavedPost.belongsTo(User, { foreignKey: "userId", as: "saver" });

Post.hasMany(SavedPost, {
  foreignKey: "postId",
  as: "savedPosts",
  onDelete: "CASCADE",
});
SavedPost.belongsTo(Post, { foreignKey: "postId", as: "savedPost" });

// Model ve sequelize bağlantısını dışa aktarıyoruz
module.exports = {
  sequelize,
  User,
  favoritedGames,
  LikedGames,
  Post,
  replyPost,
  UserPostFeatured,
  Follow,
  SavedPost,
};
