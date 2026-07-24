import { App } from '@slack/bolt';
import type { ProcessCommand } from '../commands/router';
import type { ReactionOperations } from '../services/reactionService';

export interface MessageHandlerDependencies {
  processCommand: ProcessCommand;
  reactionService: ReactionOperations;
}

/**
 * メッセージイベントハンドラの登録
 * @param app Boltアプリケーションインスタンス
 */
export const registerMessageHandlers = (
  app: App,
  dependencies: MessageHandlerDependencies,
): void => {
  // メッセージイベントのリスナー
  app.message(async ({ message, client, logger, say }) => {
    try {
      // GenericMessageEventのみを処理（bot_messageなどのsubtypeを除外）
      if (message.subtype !== undefined) {
        return;
      }

      // メッセージイベントの型チェック
      if (!('text' in message) || !message.text) {
        return;
      }

      // channel_typeがGenericMessageEventに存在することを確認
      if (!('channel_type' in message)) {
        return;
      }

      // DMチャンネルかどうかを判定（channel_typeプロパティを使用）
      const isDM = message.channel_type === 'im';

      // DMの場合はコマンド処理を行う
      if (isDM) {
        await dependencies.processCommand(message.text, message, say, logger, client);
        return;
      }

      const mappings = dependencies.reactionService.findMatchingMappings(message.text);

      if (mappings.length > 0) {
        for (const mapping of mappings) {
          try {
            await client.reactions.add({
              channel: message.channel,
              timestamp: message.ts,
              name: mapping.reaction.replace(/:/g, ''),
            });

            dependencies.reactionService.incrementReactionUsage(
              mapping.triggerText,
              mapping.reaction,
            );
          } catch (error) {
            logger.warn('リアクション追加失敗', {
              reaction: mapping.reaction,
              channel: message.channel,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    } catch (error) {
      logger.error('メッセージハンドラエラー', {
        channel: message.channel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
};
