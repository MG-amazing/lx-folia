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

## v0.1.1 修正

播放时静止约5秒后控制栏与进度条完全淡出，移动恢复；暂停显示。放大 Pendolo / Cappella / Still 的歌词，提升翻译对比度。流畅优先降低背景像素预算、关闭 Tempera 全屏后处理，背景帧率可选30/60。保留真实逐字时间；逐行歌词不再拆成重叠的伪单词。换歌立即清除上一首渲染器，避免原组件等待新歌词时暂留旧内容。

## v0.1.2 逐字歌词优先

先用缓存中的细粒度逐字歌词；缓存仅逐行或按大词组计时，则后台刷新本曲官方歌词，再尝试最多3个严格匹配的同录音来源。匹配校验曲名、歌手、版本、时长、歌词正文和时间轴，重复副歌按最近出现位置对齐，支持逐字版重新分行。通过校验的版本更新LX、Folia动效及歌词缓存，不切换音频。未找到时保持现有歌词，不生成伪逐字时间。默认开启LX逐字显示。

## v0.1.3 逐字入场动画

保留真实逐字歌词优先；仅有逐行歌词时，渲染器按字素生成连续、不重叠的装饰入场时间，仍标记为逐行估算，不写入歌词缓存。恢复逐字弹出，Tempera 不再强制整句模式。

## v0.1.4 Fume 修复与性能优化

修复 Fume 动画覆盖居中变换造成的半屏右移；长句按可视区域适配，进入效果和跳转进度时定位当前段落。流畅模式将全文布局搜索从32次降到8次，使用有限栅格缓存并减少重复发光/背景绘制；画质模式保留完整搜索。歌词内容未变时复用行数据，切换画质时正确重建。底部字幕随控制栏显隐避让，保留鼠标静止5秒隐藏。

验证：28项检查通过；可见1920x1040桌面窗口、同一组80行测试文本、Fume+Latent、流畅模式，首次文字约3.22秒降至1.10秒，稳定阶段两版均约60FPS；这是本地效果加载测试，不代表音源网络请求速度。成品包另验证画布位置、长句范围、逐字入场、5秒隐藏和鼠标恢复，安装包资源与被测运行目录的app.asar SHA256一致。

## v0.1.5 KTV API 与电脑队列

Open API 设置中由管理员指定密码；所有原有接口及 KTV 接口使用 X-API-Key 或 Bearer 密码鉴权，长期有效，修改密码立即失效；限制直接内网地址访问。新增搜索、点歌、待播、置顶、移除、切歌接口，与 LX 原生稍后播放队列一致。电脑右下角 KTV 按钮查看并操作同一队列。不包含手机页面。

[接口文档](extensions/folia/KTV-API.md)；[OpenAPI 定义](extensions/folia/ktv-openapi.json)。33 项检查通过；成品程序验证网易真实搜索20条、原生队列操作/切歌、PC/API 同步、密码修改与内网 IP/CORS。音频在隔离测试环境静音，未将选中歌曲等同于验证音源音频交付。
