![Banner](https://raw.githubusercontent.com/GalvinGao/NeteaseRecommendationSync/main/docs/assets/banner.png)

## 功能

- [x] 同步网易云音乐每日推荐至 Spotify
- [x] 同步 Spotify 所喜欢的音乐至网易云音乐（用于算法优化）
  - [x] 现在使用的逻辑为，在同步网易云音乐每日推荐至 Spotify 后，保存解析的网易云音乐歌曲 -> Spotify Track 的 ID 映射，这样可保证同步的音乐是网易云音乐此前推荐音乐中的，杜绝由于搜索词不同导致的同步偏差或遗漏。
  - [ ] 但此逻辑对于非每日推荐的音乐无效。后续将考虑对这部分没有匹配的音乐通过搜索词进行匹配后同步喜欢状态。
- [ ] 同步网易云音乐歌单至 Spotify

## 使用

1. `cp .env.example .env` 后修改 `.env` 配置
2. 启动 NeteaseCloudMusicApi 服务（参照 [NeteaseCloudMusicApi 文档 - 安装](https://neteasecloudmusicapi.vercel.app/#/?id=%e5%ae%89%e8%a3%85)）
3. 使用 `npm run start` 启动本服务

## License

[MIT](LICENSE)

## 致谢

- [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
