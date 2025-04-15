import { Command, CommandContext, getThreadTs } from './types';
import { shuffleArray } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * 指定された項目をランダムに並び替えるコマンドの実装
 */
export class ShuffleCommand implements Command {
  name = 'shuffle';
  description = '指定された項目をランダムに並び替えて順序付けて返します';
  examples = [`${BOT_MENTION_NAME} shuffle A B C D`, `${BOT_MENTION_NAME} shuffle 項目1 項目2 項目3`];

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args } = context;
    const threadTs = getThreadTs(event);
    
    // 引数が2つ未満の場合はエラーメッセージを表示
    if (args.length < 2) {
      await say({
        text: `並び替える項目を2つ以上指定してください。\n例: \`${BOT_MENTION_NAME} shuffle A B C D\``,
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }
    
    // 引数の配列をシャッフル
    const shuffledItems = shuffleArray(args);
    
    // 順序付けて結果を表示
    const resultText = shuffledItems
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n');
    
    await say({
      text: `シャッフル結果:\n${resultText}`,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}