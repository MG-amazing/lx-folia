# LX Folia

基于 **[LX Music Desktop](https://github.com/lyswhut/lx-music-desktop)** 与 **[Folia](https://github.com/chthollyphile/folia-major)** 整合开发的 Windows 音乐播放器，将 LX 的播放、歌单、搜索与下载能力和 Folia 的动态歌词效果接在一起。

本项目是第三方整合开发版。LX Music、Folia 和音源脚本的作者署名、许可证与对应源码均予以保留，详细说明见 **[项目来源与整合说明](THIRD_PARTY_NOTICES.md)**。

## 下载

- **[最新版安装包与源码](https://github.com/MG-amazing/lx-folia/releases/latest)**
- [v0.1.6 发布说明](https://github.com/MG-amazing/lx-folia/releases/tag/v0.1.6)
- 当前发布平台：Windows x64；安装文件为 `LX-Folia-v0.1.6-win-x64-Setup.exe`。
- Releases 同时提供 SHA256 校验文件和对应源码归档。

## 功能

- LX 原生播放、搜索、歌单、本地音乐与下载，自定义音源预置。
- Folia 风格主界面、独立无边框歌词窗口、封面控制面板、时间轴跳转、音量和播放控制。
- **14 种歌词效果**：Sonnet、Tempera、Lumière、Classic、Cadenza、Partita、Fume、Tilt、Claddagh、Monet、Pendolo、Cappella、Diorama、Still。
- **6 种背景**：Common、Monet、Nomand、Latent、Web Embed、Sora。默认 Classic「流光」+ Latent 混合背景。
- 网易云、QQ、酷狗、酷我四路并行匹配逐字歌词，核对曲名、歌手、录音版本、时长、歌词正文与时间轴后比较真实逐字细度。
- 没有可靠逐字版本时，动效舞台仅保留背景，不生成估算逐字时间；前奏、间奏、尾奏和明确空白段隐藏歌词。LX 原生普通歌词能力继续保留。
- 内网密码保护的预约 API，以及电脑端预约队列；支持搜索、点歌、查看正在播放/待播歌曲、置顶、移除和切歌。
- 默认日语与特大窗口，支持切换语言；长句适配、翻译字幕、流畅/画质模式和控制栏闲置约 5 秒隐藏。
- 官方自动更新检查、下载与自动安装均已关闭；定制版本通过本仓库 Releases 发布。

## 安装与使用

1. 从 Releases 下载 Windows x64 安装包运行，按原安装向导选择目录。原安装协议、首次启动确认及倒计时保持原样。
2. 默认日语，可在「設定 → 基本設定 → 言語」切换语言。
3. 主界面右下角「歌詞エフェクト」打开歌词窗口，窗口右下角 ✧ 打开封面面板，选择歌词效果与背景。
4. Space 暂停，方向键前后 5 秒，F11 全屏，Esc 退出全屏。

配置、歌单和音源选择保存在独立目录 `%APPDATA%\lx-folia`。已有 LX Folia 用户可退出程序后覆盖安装；建议先备份该目录。发布附件不包含个人配置、账号或测试歌曲。

逐字歌词和音源的歌曲覆盖率、可用性取决于第三方提供方。四路都找不到可靠逐字版本时，舞台不显示歌词。

## 预约 API

在 LX 的 Open API 设置中指定管理员密码，开启接口并按需允许局域网访问。调用者使用 `X-API-Key: 密码` 或 `Authorization: Bearer 密码`，密码长期有效，修改后旧密码立即失效。接口只接受直接内网地址访问。

电脑右下角「预约 / 予約」可查看并操作同一条原生稍后播放队列。

- [API 使用文档](extensions/folia/reservation-API.md)
- [OpenAPI 定义](extensions/folia/reservation-openapi.json)
- `GET /reservation/status` 同时返回 `nowPlaying` 和 `queue`。

## 基于哪些项目

| 项目 | 采用版本 | 使用与整合范围 |
| --- | --- | --- |
| [LX Music Desktop](https://github.com/lyswhut/lx-music-desktop) | v2.12.6 | 播放器、搜索、歌单、下载、歌词 SDK、自定义音源与原生 Open API；Apache-2.0 |
| [Folia](https://github.com/chthollyphile/folia-major) | commit `7701347918a4177c1c57b538d7556db9606be67a` | 歌词视觉渲染、14 种效果与 6 种背景；AGPL-3.0 |
| [HYWmusic_source](https://github.com/Macrohard0001/HYWmusic_source) | 脚本 v1.1.0 | 预置 HYWmusic 脚本，保留 Ryn 作者署名与头部 MIT 声明 |
| 星澜聚合音源 | 桌面适配版 | 保留星澜团队署名，适配桌面响应校验和备用接口；未确认公开上游仓库地址 |

本仓库新增 LX/Folia 数据桥接、桌面交互适配、逐字歌词匹配与空档处理、内网密码鉴权、预约 API/电脑队列、界面本地化、性能适配和独立打包。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

整合改动与 Folia 渲染器按根目录 [AGPL-3.0](LICENSE) 提供；LX 原始代码的 [Apache-2.0](LICENSE.LX) 和其他组件各自声明继续保留。原 LX 项目说明见 [README-LX.md](README-LX.md)，历史变更见 [CHANGELOG.md](CHANGELOG.md)。

## 构建与验证

需要 Node.js 22+，以及官方 LX Music Desktop 2.12.6 的 Windows x64 解压目录。Folia 渲染器依赖和锁文件位于对应目录。

```powershell
cd extensions/folia/renderer-source/renderer/folia
npm ci
node build.mjs
cd ../../../../..
node extensions/folia/prepare-desktop.cjs
# 单独安装工具：npm install --prefix <工具目录> @electron/asar
node extensions/folia/pack.cjs <LX官方解压目录> <新的空输出目录> <asar模块绝对路径>
```

扩展只接受已验证的 LX 2.12.6 编译锚点，匹配失败会停止打包。Windows 安装器配置见 [installer.json](installer.json)。

v0.1.6 发布前通过 **42 项自动化测试**；隔离成品环境验证四家真实逐字歌词请求、演唱/空档显隐、无逐字数据留空和更新功能禁用。安装包内 `app.asar` 与实测程序 SHA256 一致。上述是该次测试结果，不保证所有歌曲或所有网络环境均有可用歌词和音源。
