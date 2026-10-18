# 项目来源与整合说明

LX Folia 是基于 LX Music Desktop 和 Folia 的第三方整合开发版本，由本仓库维护桌面适配与集成功能。项目名称和发布版本不代表上游官方发行。

## 主要上游

| 项目 | 使用版本 | 本项目使用的部分 | 许可与源码 |
| --- | --- | --- | --- |
| [LX Music Desktop](https://github.com/lyswhut/lx-music-desktop) | v2.12.6 | Electron 桌面播放器、音乐搜索、歌单、本地音乐、下载、自定义音源、歌词 SDK、原生 Open API、安装流程 | Apache-2.0，保留于 [LICENSE.LX](LICENSE.LX)；原项目说明见 [README-LX.md](README-LX.md) |
| [Folia](https://github.com/chthollyphile/folia-major) | commit [`7701347918a4177c1c57b538d7556db9606be67a`](https://github.com/chthollyphile/folia-major/tree/7701347918a4177c1c57b538d7556db9606be67a) | 歌词视觉渲染、14 种歌词效果、6 种背景及相关布局、动画组件 | AGPL-3.0，保留于 [FOLIA-AGPL-3.0.txt](extensions/folia/FOLIA-AGPL-3.0.txt)；原文件清单见 [UPSTREAM.json](extensions/folia/renderer-source/renderer/folia/vendor/UPSTREAM.json) |

本仓库的整合改动和 Folia 渲染器以根目录 [LICENSE](LICENSE) 中的 AGPL-3.0 提供；LX 原始代码的 Apache-2.0 声明、其他组件各自的许可证与作者署名继续保留。

## 本仓库的整合开发

- 在 LX 的原生播放、搜索、歌单与下载能力上接入独立 Folia 歌词窗口，桥接真实播放时钟、歌词和音频分析数据。
- 适配桌面效果选择、封面控制面板、字号、翻译字幕、窗口布局、控制栏闲置隐藏以及流畅/画质模式。
- 实现网易云、QQ、酷狗、酷我四路并行歌词匹配，校验同一录音的元数据、正文和时间轴后选用真实逐字数据。没有可靠数据时舞台留空，不伪造逐字时间。
- 根据明确空白段及逐字结束时间处理前奏、间奏、尾奏的歌词退场。
- 在 LX 原生 Open API 上增加内网密码鉴权，以及搜索、预约、队列查询、置顶、移除、切歌接口；电脑面板与 API 共用 LX 原生稍后播放队列。
- 提供日语默认界面、桌面音源预置、独立用户配置目录和 Windows x64 安装包，保留原安装协议与首次启动确认。
- 禁用原版自动更新检查、下载与自动安装，避免定制版本被原版覆盖。

## 音源脚本

| 脚本 | 作者与来源 | 集成情况 |
| --- | --- | --- |
| 星澜聚合音源（桌面版） | 脚本头部署名“星澜团队”；本次集成未确认其公开上游仓库地址，不虚构链接或许可证 | [桌面适配脚本](extensions/folia/sources/StellarWave-LX-desktop.js)，保留署名，增加桌面响应校验与备用接口处理 |
| HYWmusic_公益版 v1.1.0 | 头部署名 Ryn，主页 [Macrohard0001/HYWmusic_source](https://github.com/Macrohard0001/HYWmusic_source)，头部许可声明 MIT | [预置脚本](extensions/folia/sources/HYWmusic-v1.1.0.js)，保留原始头部、版本、作者与许可声明 |

脚本的第三方接口由各自提供方维护。音源脚本作者、LX Music 作者、Folia 作者与本仓库维护者分别拥有各自贡献；本项目没有将这些上游作品声明为独立原创。

## 其他依赖与对应源码

LX 及离线渲染器的依赖由各自的 `package.json` 和锁文件记录，包括 Electron、Vue、React、PixiJS、Three.js、Framer Motion 等；各依赖按其自身许可证提供。参见 [LX 依赖](package.json)、[渲染器依赖](extensions/folia/renderer-source/renderer/folia/package.json) 与上游保留的许可证、NOTICE。

Releases 附带 Windows 安装包、SHA256 校验文件和对应源码归档。`v0.1.6` 的程序代码对应发布标签；仓库后续文档修订可以另行更新，不改变已发布安装包。
