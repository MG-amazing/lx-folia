# LX Folia

LX Music 2.12.6 + Folia 的完整歌词与背景效果，Windows x64 独立打包版。

- 默认特大窗口（1385 × 896），歌词窗口同尺寸。
- 默认日语，设置 → 基本设置 → 语言可以切换日本語 / 简体中文 / 繁體中文 / English / 한국어。
- 保留 LX 原版安装协议、安装选项、首次启动协议和确认倒计时，不自动接受。
- Folia 风格主界面、无边框歌词窗口、封面控制面板、时间轴跳转、音量和播放控制。
- 全部 14 种歌词效果：Sonnet、Tempera、Lumière、Classic、Cadenza、Partita、Fume、Tilt、Claddagh、Monet、Pendolo、Cappella、Diorama、Still。
- 全部 6 种背景：Common、Monet、Nomand、Latent、Web Embed、Sora。默认 Classic「流光」+ Latent 混合背景。
- 两个预置音源：StellarWave DMSYS desktop 与 HYW v1.1.0，首次使用仍须按原版流程接受协议。服务可用性由各音源提供方决定。
- 保留 LX 播放、搜索、歌单、本地歌曲和下载功能。使用独立 `%APPDATA%\lx-folia` 配置，不覆盖原 LX 配置。
- 播放时使用 LX 的真实 Audio 时钟和 WebAudio 分析数据；只有逐行时间的歌词不伪造逐字时间。长句按窗口大小缩放，打开侧面板时为歌词预留空间。

## 使用

运行安装包，或解压 ZIP 后运行 `LX-Folia.exe`。主界面右下角「歌詞エフェクト」打开歌词窗口；窗口右下角 ✧ 打开封面面板。点击当前效果名称或「すべてのエフェクトと設定」选择全部效果。Space 暂停，方向键前后 5 秒，F11 全屏，Esc 退出。

## 构建

需要 Node.js 22+。完整对应源码、原项目许可证和依赖锁文件均在本仓库，不含个人配置、账号或测试歌曲。

```powershell
# 构建全部 Folia 渲染器
cd extensions/folia/renderer-source/renderer/folia
npm ci
node build.mjs
cd ../../../../..
node extensions/folia/prepare-desktop.cjs
# npm install --prefix <工具目录> @electron/asar
# 输入：官方 LX 2.12.6 Windows x64 的解压目录；输出须为空
node extensions/folia/pack.cjs <LX官方解压目录> <新的输出目录> <asar模块绝对路径>
node --test extensions/folia/convert.test.cjs extensions/folia/locale.test.cjs extensions/folia/renderer-source/renderer/folia/src/fitLyrics.test.mjs
```

`install.cjs` 仅支持官方 2.12.6，匹配唯一编译锚点后接入扩展，锚点不匹配立即停止。`pack.cjs` 复制官方运行时并独立配置。安装器使用 LX 原来的 NSIS 选项：非一键安装、原中文协议 RTF、可选择安装目录；详情见 `installer.json`。`prepare.cjs` 的旧 9 效果构建入口已停用。

## 验证

隔离测试配置中使用本地《江南 Style》音频、实际歌词和封面回归：14 歌词 + 6 背景切换无渲染报错，真实音频数据到达；歌词转换、窗口适配和语言完整性测试通过。全新配置默认日语，原版协议仍出现，接受状态初始为 false。未将测试配置写入发布包。

## 来源与许可

LX 原始源码：lyswhut/lx-music-desktop，v2.12.6，Apache-2.0，原许可证保留为 `LICENSE.LX`。
Folia：chthollyphile/folia-major，commit 7701347918a4177c1c57b538d7556db9606be67a，AGPL-3.0；渲染器、集成改动及其完整对应源码按 AGPL-3.0 提供。参见根目录 LICENSE、extensions/folia/NOTICE.txt 以及 renderer-source 中的上游声明。
音源脚本保留各自原始头部和许可声明。
