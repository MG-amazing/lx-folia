# 预约 点歌 API

设置 → Open API：启用服务、允许 LAN，管理员设置密码并保存。默认端口 23330。未设置密码拒绝访问；仅允许本机、IPv4 私网和 IPv6 本地地址。密码不设过期时间，修改后旧密码与现有订阅连接立即失效。

每次请求携带 `X-API-Key: 管理员设置的密码`，或 `Authorization: Bearer 管理员设置的密码`。不接受 URL 中的密码。浏览器跨域调用支持 OPTIONS 预检。

## 点歌流程

1. `GET /reservation/search?q=关键词&source=wy&page=1` 搜索，source 支持 wy/kw/kg/tx/mg，默认 wy。
2. 从返回的 `list` 取得 `musicId`。
3. `POST /reservation/queue`，JSON：`{"musicId":"搜索返回的ID"}`。可加 `"top":true` 优先点播。
4. `GET /reservation/queue` 查看待播队列；电脑右下角的 预约 按钮显示同一队列。
5. `POST /reservation/queue/top`，JSON：`{"queueId":"队列返回的ID"}`，置顶。
6. `POST /reservation/queue/remove`，同样传 queueId，移除。
7. `POST /reservation/next`，JSON：`{}`，切至队列首曲；队列空时暂停当前曲，不跳到其他歌单。

入队后，空闲播放器可能立即播放第一首，该曲不再显示在待播队列中。当前歌曲查询 `/status`。使用 LX 原生稍后播放队列，歌曲和列表不做额外复制。重复的待播 musicId 不重复加入；最多 200 首。queueId 对应本次运行的队列条目，已播放、移除或重启后失效。musicId 必须来自本次运行的搜索缓存，缓存最多 2000 首。

## 原有接口

原有 `/status`、`/play`、`/pause`、`/skip-next`、`/skip-prev`、`/seek?offset=秒`、`/volume?volume=0至100`、`/mute?mute=true或false`、`/lyric-all`、`/subscribe-player-status` 等保持原协议，但同样必须携带密码。原有 skip-next 保留 LX 原行为，预约 客户端使用 `/reservation/next`。

示例（密码使用本机环境变量，不写进 URL）：

```powershell
$headers = @{ 'X-API-Key' = $env:LX_API_PASSWORD }
Invoke-RestMethod 'http://LX电脑内网IP:23330/reservation/search?q=江南style&source=wy' -Headers $headers
Invoke-RestMethod 'http://LX电脑内网IP:23330/reservation/queue' -Headers $headers -Method Post -ContentType 'application/json' -Body '{"musicId":"搜索返回的ID"}'
```

返回：200 成功；400 参数错误/搜索或播放器操作失败；401 密码缺失/错误；403 非内网地址；503 未设置密码或播放器未就绪。

API 由 LX 进程提供，关闭 LX 后服务随之关闭。PC 队列面板可置顶、移除、切歌，以及进入 API 设置。不包含手机页面。

## 当前播放与预约列表统一查询

`GET /reservation/status`，同样携带密码请求头，返回：

```json
{
  "nowPlaying": {
    "musicId": "wy_example", "name": "当前歌曲", "singer": "歌手", "source": "wy", "album": "专辑",
    "state": "playing", "progress": 42.5, "duration": 219.5, "volume": 0.8, "muted": false
  },
  "queue": [
    {"queueId": "预约条目ID", "musicId": "wy_next", "name": "下一首歌曲", "singer": "歌手", "source": "wy", "interval": "03:00"}
  ]
}
```

state 为 stopped/loading/playing/paused/error。queue 按预约顺序排列，不含正在播放的歌曲；queueId 用于置顶与取消预约。没有当前歌曲时 musicId 为 null。progress/duration 单位为秒；未加载时 duration 为 0。查询不会改变播放状态。
