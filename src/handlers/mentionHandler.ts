import { App, Logger, AllMiddlewareArgs } from '@slack/bolt';
import { parseCommand } from '../utils/random';
import { CommandContext, SlackEvent, SayFunction, getThreadTs } from '../commands/types';
import { getCommand, getCommandRegistration } from '../commands';
import { handleCommandError } from '../utils/errorHandler';

/**
 * コマンド処理を行う関数
 * @param text コマンドテキスト
 * @param event イベントオブジェクト
 * @param say メッセージ送信関数
 * @param logger ロガー
 */
export const processCommand = async (
  text: string,
  event: SlackEvent,
  say: SayFunction,
  logger: Logger,
  client: AllMiddlewareArgs['client'],
): Promise<void> => {
  const threadTs = getThreadTs(event);

  // コマンドコンテキストを作成（エラーハンドリングで使用）
  const context: CommandContext = {
    event,
    say,
    logger,
    args: [], // 後で更新
    client,
  };

  try {
    const args = parseCommand(text);

    if (args.length === 0) {
      await say({
        text: '何かコマンドを指定してください。',
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }

    const commandName = args[0].toLowerCase();
    const command = getCommand(commandName);

    // DM専用コマンドのチェック
    const registration = getCommandRegistration(commandName);
    if (registration?.dmOnly) {
      // DMかどうかを判定
      const isDM = event.channel_type === 'im';

      if (!isDM) {
        await say({
          text: 'このコマンドはDM専用です。DMで実行してください。',
          ...(threadTs && { thread_ts: threadTs }),
        });
        return;
      }
    }

    // コマンドコンテキストを更新
    context.args = args.slice(1); // 最初の引数（コマンド名）を除いた残りの引数

    // コマンドを実行
    await command.execute(context);
  } catch (error) {
    await handleCommandError(error, context, 'mentionHandler');
  }
};

/**
 * メンションイベントハンドラの登録
 * @param app Boltアプリケーションインスタンス
 */
export const registerMentionHandlers = (app: App): void => {
  // アプリメンションイベントのリスナー
  app.event('app_mention', async ({ event, say, logger, client }) => {
    // 最初のメンション（ボット自身へのメンション）だけを削除
    // 例: "<@BOT_ID> command <@USER1> <@USER2>" -> "command <@USER1> <@USER2>"
    const text = event.text.replace(/^<@[A-Z0-9]+>/, '').trim();
    await processCommand(text, event, say, logger, client);
  });
};
