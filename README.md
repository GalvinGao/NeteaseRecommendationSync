![Banner](https://raw.githubusercontent.com/GalvinGao/NeteaseRecommendationSync/main/docs/assets/banner.png)

## 功能

- [x] 同步网易云音乐每日推荐至 Spotify
- [ ] 同步 Spotify 所喜欢的音乐至网易云音乐（用于算法优化）
- [ ] 同步网易云音乐歌单至 Spotify

## 使用

1. `cp .env.example .env` 后修改 `.env` 配置
2. 启动 NeteaseCloudMusicApi 服务（参照 [NeteaseCloudMusicApi 文档 - 安装](https://neteasecloudmusicapi.vercel.app/#/?id=%e5%ae%89%e8%a3%85)）
3. 使用 `npm run start` 启动本服务

## License

[MIT](LICENSE)

## 致谢

- [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
