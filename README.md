![Banner](https://raw.githubusercontent.com/GalvinGao/NeteaseRecommendationSync/main/docs/assets/banner.png)

## 功能

- [x] 同步网易云音乐每日推荐至 Spotify
- [x] 将网易云音乐我喜欢的音乐导入至 Spotify 歌单
- [x] 同步 Spotify 所喜欢的音乐至网易云音乐（用于算法优化）
  - [x] 现在使用的逻辑为，在同步网易云音乐每日推荐至 Spotify 后，保存解析的网易云音乐歌曲 -> Spotify Track 的 ID 映射，这样可保证同步的音乐是网易云音乐此前推荐音乐中的，杜绝由于搜索词不同导致的同步偏差或遗漏。
  - [ ] 但此逻辑对于非每日推荐的音乐无效。后续将考虑对这部分没有匹配的音乐通过搜索词进行匹配后同步喜欢状态。
- [ ] 同步网易云音乐歌单至 Spotify

## 使用

1. `cp .env.example .env` 后修改 `.env` 配置

   1. `SPOTIFY_CLIENT_ID` 和 `SPOTIFY_CLIENT_SECRET` 为 Spotify 开发者账号的 Client ID 和 Client Secret；申请请参考 [Spotify for Developers](https://developer.spotify.com/dashboard/applications)。

   1. `NETEASE_MUSIC_PHONE` 和 `NETEASE_MUSIC_PASSWORD` 为网易云音乐账号的手机号和密码。

1. 配置修改完毕后，使用 `npm run start` 启动每日推荐服务
   1. 或者使用 `npm run importLike` 将网易云音乐我喜欢的音乐导入至 Spotify 歌单，由于 Spotify Api 的速率限制，根据歌单长度你将消耗额外的时间。
1. 留意 Console 信息，你将需要通过 Spotify OAuth 授权本服务访问你的 Spotify 账号
1. 授权通过并完成首次同步后，本项目将会：
   1. 在 `Asia/Shanghai` 时区的每天 6:10 AM 自动同步网易云音乐每日推荐至 Spotify
   1. 在 `Asia/Shanghai` 时区的每天 9:10 AM, 15:10 PM, 21:10 PM, 3:10 AM 自动同步 Spotify 所喜欢的音乐至网易云音乐

## License

[MIT](LICENSE)

## 致谢

- [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
