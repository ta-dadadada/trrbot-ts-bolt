import { Command, CommandContext, getThreadTs } from './types';
import { getRandomString } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * ランダムな文字列を生成するコマンドの実装
 */
export class ZakoSecretCommand implements Command {
  name = 'zako-secret';
  description = '指定された長さのランダムな英数字文字列を生成します';
  examples = [`${BOT_MENTION_NAME} zako-secret 10`, `${BOT_MENTION_NAME} zako-secret 20`];

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args, logger } = context;
    const threadTs = getThreadTs(event);
    
    // デフォルトは10文字
    let length = 10;
    
    // 引数がある場合は、指定された長さの文字列を生成
    if (args.length > 0) {
      const lengthArg = parseInt(args[0], 10);
      
      if (isNaN(lengthArg) || lengthArg < 1) {
        await say({
          text: '有効な正の整数を指定してください。',
          ...(threadTs && { thread_ts: threadTs }),
        });
        return;
      }
      
      // 長すぎる文字列の生成を防止（最大100文字）
      length = Math.min(lengthArg, 100);
    }
    
    try {
      const result = getRandomString(length);
      
      await say({
        text: `🔑 生成されたシークレット文字列: \`${result}\``,
        ...(threadTs && { thread_ts: threadTs }),
      });
    } catch (error) {
      logger.error('ランダム文字列生成コマンドの実行中にエラーが発生しました', error);
      await say({
        text: 'ランダム文字列の生成中にエラーが発生しました。',
        ...(threadTs && { thread_ts: threadTs }),
      });
    }
  }
}