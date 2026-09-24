# koishi-plugin-yesimbot-extension-discord-reaction

> 自用插件：为 YesImBot 提供 Discord 表情回应能力。

为 YesImBot 注册 `discord_add_reaction` 工具：在 Discord 频道中，当模型认为某条消息值得用表情回应（表达赞同、感谢、有趣等）时，可调用该工具为指定消息添加表情。

## 安装

```bash
npm install koishi-plugin-yesimbot-extension-discord-reaction
```

## 依赖条件

- Koishi v4 与已启用的 `koishi-plugin-yesimbot`；
- 已接入 Discord 适配器（`@koishijs/plugin-adapter-discord`）。

无需额外配置项；工具仅对 Discord 平台会话可见、可调用。

## 模型工具

`discord_add_reaction(channel_id, message_id, emoji)`

| 参数 | 必填 | 说明 |
|---|---|---|
| `channel_id` | 是 | Discord 频道 ID |
| `message_id` | 是 | 要回应的消息 ID |
| `emoji` | 是 | 表情符号，如 `😊`、`👍`，或自定义表情 `name:id` |

## 开源协议

MIT
