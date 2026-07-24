import { Command, CommandContext, getThreadTs } from './types';
import { getRandomInt } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';
import { logDebug } from '../utils/errorHandler';
import { ValidationError } from '../utils/errors';

/**
 * サイコロを振るコマンドの実装
 */
export class DiceCommand implements Command {
  description = 'サイコロを振って、ランダムな数字を返します';

  getExamples(commandName: string): string[] {
    return [
      `${BOT_MENTION_NAME} ${commandName}`,
      `${BOT_MENTION_NAME} ${commandName} 10`,
      `${BOT_MENTION_NAME} 2d6`,
      `${BOT_MENTION_NAME} 3d10`,
    ];
  }

  /**
   * ダイスコード（例: 2d6）を解析する
   * @param diceCode ダイスコード文字列
   * @returns [ダイスの数, ダイスの面数] または null（無効な形式の場合）
   */
  private parseDiceCode(diceCode: string): [number, number] | null {
    // nDm または ndm 形式（大文字小文字を区別しない）
    const match = diceCode.toLowerCase().match(/^(\d+)d(\d+)$/);
    if (!match) {
      return null;
    }

    const diceCount = parseInt(match[1], 10);
    const diceFaces = parseInt(match[2], 10);

    // 有効な正の整数かチェック
    if (isNaN(diceCount) || diceCount < 1 || isNaN(diceFaces) || diceFaces < 1) {
      return null;
    }

    return [diceCount, diceFaces];
  }

  /**
   * 複数のダイスを振って合計値を計算する
   * @param count ダイスの数
   * @param faces ダイスの面数
   * @returns 各ダイスの結果と合計値
   */
  private rollMultipleDice(count: number, faces: number): { results: number[]; total: number } {
    const results: number[] = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
      const roll = getRandomInt(1, faces);
      results.push(roll);
      total += roll;
    }

    return { results, total };
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args, invokedName, logger } = context;
    const threadTs = getThreadTs(event);

    logDebug(logger, 'dice', 'Parsing dice command', { args });

    const commandNameDiceCode = this.parseDiceCode(invokedName);

    if (commandNameDiceCode) {
      const [diceCount, diceFaces] = commandNameDiceCode;
      const { results, total } = this.rollMultipleDice(diceCount, diceFaces);

      await say({
        text: `🎲 ${diceCount}d${diceFaces} の結果: ${results.join(', ')} = *${total}*`,
        ...(threadTs && { thread_ts: threadTs }),
      });

      return;
    }

    if (args.length > 0) {
      const argDiceCode = this.parseDiceCode(args[0]);

      if (argDiceCode) {
        const [diceCount, diceFaces] = argDiceCode;
        const { results, total } = this.rollMultipleDice(diceCount, diceFaces);

        await say({
          text: `🎲 ${diceCount}d${diceFaces} の結果: ${results.join(', ')} = *${total}*`,
          ...(threadTs && { thread_ts: threadTs }),
        });

        return;
      }
    }

    const min = 1;
    let max = 6;

    if (args.length > 0) {
      const maxArg = parseInt(args[0], 10);

      if (isNaN(maxArg) || maxArg < 1) {
        throw new ValidationError(
          `Invalid max value: ${args[0]}`,
          '有効な正の整数を指定してください。',
          { providedValue: args[0] },
        );
      }

      max = maxArg;
    }

    const result = getRandomInt(min, max);

    await say({
      text: `🎲 結果: *${result}*`,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}
