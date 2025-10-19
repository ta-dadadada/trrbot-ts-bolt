import { Command, CommandContext, getThreadTs } from './types';
import { getRandomItem } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * 選択肢からランダムに1つを選ぶコマンドの実装
 */
export class ChoiceCommand implements Command {
  description = '指定された選択肢からランダムに1つ選びます';

  getExamples(commandName: string): string[] {
    return [`${BOT_MENTION_NAME} ${commandName} ラーメン カレー 寿司`];
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args } = context;
    const threadTs = getThreadTs(event);

    if (args.length === 0) {
      await say({
        text: '選択肢を指定してください。',
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }

    const choice = getRandomItem(args);

    await say({
      text: `選ばれたのは: *${choice}*`,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}
