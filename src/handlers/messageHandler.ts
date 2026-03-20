import { App } from '@slack/bolt';
import type { IReactionService } from '../features/reaction';
import { processCommand } from './mentionHandler';

/**
 * メッセージイベントハンドラの登録
 * @param app Boltアプリケーションインスタンス
 * @param reactionService リアクションサービス
 */
export const registerMessageHandlers = (app: App, reactionService: IReactionService): void => {
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
        await processCommand(message.text, message, say, logger, client);
        return;
      }

      // 通常のチャンネルメッセージの場合はリアクション処理を行う
      // メッセージテキストにマッチするマッピングを取得（1回のDB呼び出し）
      const matchingMappings = reactionService.getMatchingMappings(message.text);

      // リアクションがある場合、重複を除去して追加
      const uniqueReactions = [...new Set(matchingMappings.map((m) => m.reaction))];

      for (const reaction of uniqueReactions) {
        try {
          // リアクションを追加
          await client.reactions.add({
            channel: message.channel,
            timestamp: message.ts,
            name: reaction.replace(/:/g, ''), // コロンを削除（:smile: → smile）
          });

          // マッチしたマッピングの使用回数をインクリメント
          const mapping = matchingMappings.find((m) => m.reaction === reaction);
          if (mapping) {
            reactionService.incrementReactionUsage(mapping.triggerText, mapping.reaction);
          }
        } catch (error) {
          logger.warn('リアクション追加失敗', {
            reaction,
            channel: message.channel,
            error: error instanceof Error ? error.message : String(error),
          });
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
