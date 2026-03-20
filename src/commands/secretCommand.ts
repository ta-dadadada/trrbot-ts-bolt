import { Command, CommandContext } from './types';
import { getReplyOptions } from './utils';
import { getRandomStringWithSymbols } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * 記号を含むランダムな文字列を生成するコマンドの実装
 */
export class SecretCommand implements Command {
  description = '指定された長さのランダムな英数字と記号を含む文字列を生成します';

  getExamples(commandName: string): string[] {
    return [`${BOT_MENTION_NAME} ${commandName} 10`, `${BOT_MENTION_NAME} ${commandName} 20`];
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args, logger } = context;
    const replyOptions = getReplyOptions(event);

    // デフォルトは10文字
    let length = 10;

    // 引数がある場合は、指定された長さの文字列を生成
    if (args.length > 0) {
      const lengthArg = parseInt(args[0], 10);

      if (isNaN(lengthArg) || lengthArg < 1) {
        await say({
          text: '有効な正の整数を指定してください。',
          ...replyOptions,
        });
        return;
      }

      // 長すぎる文字列の生成を防止（最大100文字）
      length = Math.min(lengthArg, 100);
    }

    try {
      const result = getRandomStringWithSymbols(length);

      await say({
        text: `🔐 生成されたシークレット文字列（記号含む）: \`${result}\``,
        ...replyOptions,
      });
    } catch (error) {
      logger.error('ランダム文字列生成コマンドの実行中にエラーが発生しました', error);
      await say({
        text: 'ランダム文字列の生成中にエラーが発生しました。',
        ...replyOptions,
      });
    }
  }
}
