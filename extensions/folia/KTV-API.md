# KTV 点歌 API

设置 → Open API：启用服务、允许 LAN，管理员设置密码并保存。默认端口 23330。未设置密码拒绝访问；仅允许本机、IPv4 私网和 IPv6 本地地址。密码不设过期时间，修改后旧密码与现有订阅连接立即失效。

每次请求携带 `X-API-Key: 管理员设置的密码`，或 `Authorization: Bearer 管理员设置的密码`。不接受 URL 中的密码。浏览器跨域调用支持 OPTIONS 预检。

## 点歌流程

1. `GET /ktv/search?q=关键词&source=wy&page=1` 搜索，source 支持 wy/kw/kg/tx/mg，默认 wy。
2. 从返回的 `list` 取得 `musicId`。
3. `POST /ktv/queue`，JSON：`{"musicId":"搜索返回的ID"}`。可加 `"top":true` 优先点播。
4. `GET /ktv/queue` 查看待播队列；电脑右下角的 KTV 按钮显示同一队列。
5. `POST /ktv/queue/top`，JSON：`{"queueId":"队列返回的ID"}`，置顶。
6. `POST /ktv/queue/remove`，同样传 queueId，移除。
7. `POST /ktv/next`，JSON：`{}`，切至队列首曲；队列空时暂停当前曲，不跳到其他歌单。

入队后，空闲播放器可能立即播放第一首，该曲不再显示在待播队列中。当前歌曲查询 `/status`。使用 LX 原生稍后播放队列，歌曲和列表不做额外复制。重复的待播 musicId 不重复加入；最多 200 首。queueId 对应本次运行的队列条目，已播放、移除或重启后失效。musicId 必须来自本次运行的搜索缓存，缓存最多 2000 首。

## 原有接口

原有 `/status`、`/play`、`/pause`、`/skip-next`、`/skip-prev`、`/seek?offset=秒`、`/volume?volume=0至100`、`/mute?mute=true或false`、`/lyric-all`、`/subscribe-player-status` 等保持原协议，但同样必须携带密码。原有 skip-next 保留 LX 原行为，KTV 客户端使用 `/ktv/next`。

示例（密码使用本机环境变量，不写进 URL）：

```powershell
$headers = @{ 'X-API-Key' = $env:LX_API_PASSWORD }
Invoke-RestMethod 'http://LX电脑内网IP:23330/ktv/search?q=江南style&source=wy' -Headers $headers
Invoke-RestMethod 'http://LX电脑内网IP:23330/ktv/queue' -Headers $headers -Method Post -ContentType 'application/json' -Body '{"musicId":"搜索返回的ID"}'
```

返回：200 成功；400 参数错误/搜索或播放器操作失败；401 密码缺失/错误；403 非内网地址；503 未设置密码或播放器未就绪。

API 由 LX 进程提供，关闭 LX 后服务随之关闭。PC 队列面板可置顶、移除、切歌，以及进入 API 设置。不包含手机页面。
