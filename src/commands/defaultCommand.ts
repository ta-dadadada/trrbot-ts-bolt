import { Command, CommandContext, getThreadTs } from './types';
import { getRandomItem } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * デフォルトコマンドの実装
 * 未知のコマンドが入力された場合に実行される
 */
export class DefaultCommand implements Command {
  name = 'default';
  description = '未知のコマンドが入力された場合、入力されたテキスト全体を選択肢として扱います';
  examples = [`${BOT_MENTION_NAME} 選択肢1 選択肢2 選択肢3`];

  async execute(context: CommandContext): Promise<void> {
    const { event, say } = context;
    const threadTs = getThreadTs(event);
    
    // コマンドテキスト全体を取得
    const fullText = context.args.join(' ');
    
    // 空白で区切られた選択肢を取得
    const choices = fullText.split(/\s+/).filter(item => item.trim() !== '');
    
    if (choices.length > 0) {
      const choice = getRandomItem(choices);
      await say({
        text: `選ばれたのは: *${choice}*`,
        ...(threadTs && { thread_ts: threadTs }),
      });
    } else {
      await say({
        text: `'help'コマンドでヘルプを表示できます。`,
        ...(threadTs && { thread_ts: threadTs }),
      });
    }
  }
}