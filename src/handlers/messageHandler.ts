import { App } from '@slack/bolt';
import { ReactionService } from '../services/reactionService';
import { processCommand } from './mentionHandler';

/**
 * メッセージイベントハンドラの登録
 * @param app Boltアプリケーションインスタンス
 */
export const registerMessageHandlers = (app: App): void => {
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
      // メッセージテキストに対応するリアクションを取得
      const reactions = ReactionService.getReactionsForMessage(message.text);

      // リアクションがある場合、それぞれのリアクションを追加
      if (reactions.length > 0) {
        // すべてのリアクションマッピングを取得
        const allMappings = ReactionService.getAllReactionMappings();

        for (const reaction of reactions) {
          try {
            // リアクションを追加
            await client.reactions.add({
              channel: message.channel,
              timestamp: message.ts,
              name: reaction.replace(/:/g, ''), // コロンを削除（:smile: → smile）
            });

            // 対応するトリガーテキストを見つけて使用回数をインクリメント
            for (const mapping of allMappings) {
              if (mapping.reaction === reaction && message.text.includes(mapping.triggerText)) {
                ReactionService.incrementReactionUsage(mapping.triggerText, mapping.reaction);
                break; // 一致するマッピングが見つかったらループを抜ける
              }
            }
          } catch (error) {
            logger.warn('リアクション追加失敗', {
              reaction,
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
