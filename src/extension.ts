import { Context, Schema, type Session } from 'koishi'
import { Extension, Tool, Success, Failed, withInnerThoughts, type Infer, type ToolCallResult } from 'koishi-plugin-yesimbot'

/**
 * YesImBot 扩展：Discord 表情回应
 *
 * 通过 @Extension 注册为 YesImBot 的扩展，提供单个模型工具：
 * - discord_add_reaction：为指定的 Discord 消息添加表情回应。
 *
 * 仅当会话所在平台为 Discord（session.bot.platform === 'discord'）时工具对模型可见，
 * 执行前也会再次校验平台，避免在其他平台调用 Discord 专用接口而报错。
 */
@Extension({
  name: 'discord-reaction',
  display: 'Discord 表情回应',
  description: '为 YesImBot 提供 Discord 表情回应工具：在 Discord 频道中，当模型认为某条消息值得用表情回应时，可调用 discord_add_reaction 为消息添加表情。本扩展仅适用于 Discord 平台。',
  version: '1.0.0',
  author: 'YesImBot',
})
export default class YesImBotDiscordReaction {
  static readonly Config = Schema.object({})

  constructor(public readonly ctx: Context, public readonly config: never) {}

  /**
   * discord_add_reaction：为指定的 Discord 消息添加表情回应。
   * 参数 channel_id / message_id / emoji 均必填；emoji 支持 Unicode 表情（如 😊、👍）
   * 或自定义表情 name:id 格式。
   */
  @Tool<{ channel_id: string; message_id: string; emoji: string }>({
    name: 'discord_add_reaction',
    description:
      '为指定的 Discord 消息添加表情回应。当你在 Discord 频道中，且认为某条消息值得用表情回应（例如表达赞同、感谢、有趣等）时调用此工具。emoji 支持 Unicode 表情（如 😊、👍）或自定义表情（格式 name:id）。',
    parameters: withInnerThoughts({
      channel_id: Schema.string().required().description('Discord 频道 ID'),
      message_id: Schema.string().required().description('要回应的消息 ID'),
      emoji: Schema.string().required().description('表情符号，例如 😊 或 👍'),
    }),
    isSupported: (session?: Session) => session?.platform === 'discord',
  })
  async addReaction({
    session,
    channel_id,
    message_id,
    emoji,
  }: Infer<{ channel_id: string; message_id: string; emoji: string }>): Promise<ToolCallResult> {
    // 会话上下文缺失或平台非 Discord 时直接拒绝，避免调用 Discord 专用接口出错
    if (!session?.bot || session.bot.platform !== 'discord') {
      return Failed({ name: 'PlatformError', message: '当前平台不是 Discord，不用添加表情回应。', retryable: false })
    }

    const bot = session.bot
    // 旧版适配器暴露 `$createReaction` 内部方法；当前 satori 版适配器为 `createReaction`，二者兼容回退
    const legacy = (bot as unknown as Record<string, unknown>)['$createReaction']
    const createReaction =
      typeof legacy === 'function'
        ? (legacy as (channelId: string, messageId: string, emoji: string) => Promise<void>)
        : bot.createReaction.bind(bot)
    // Discord API 要求 emoji 做 URL 编码，适配器不会自动处理，这里统一编码
    const encodedEmoji = encodeURIComponent(emoji)

    try {
      await createReaction(channel_id, message_id, encodedEmoji)
      this.ctx.logger.info(`Bot[${session.selfId}] 在频道 ${channel_id} 的消息 ${message_id} 上添加了表情 ${emoji}`)
      return Success({ message: `已在 Discord 频道 ${channel_id} 的消息 ${message_id} 上添加表情 ${emoji}` })
    } catch (e) {
      this.ctx.logger.error(`添加 Discord 表情回应失败（频道 ${channel_id} / 消息 ${message_id} / 表情 ${emoji}）:`, e)
      return Failed({
        name: 'DiscordReactionError',
        message: `添加表情回应失败: ${(e as Error).message}`,
        retryable: false,
      })
    }
  }
}
