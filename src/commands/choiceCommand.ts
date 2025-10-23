import { Command, CommandContext, getThreadTs } from './types';
import { getRandomItem } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';
import { handleCommandError, logCommandSuccess } from '../utils/errorHandler';
import { ValidationError } from '../utils/errors';

/**
 * 選択肢からランダムに1つを選ぶコマンドの実装
 */
export class ChoiceCommand implements Command {
  description = '指定された選択肢からランダムに1つ選びます';

  getExamples(commandName: string): string[] {
    return [`${BOT_MENTION_NAME} ${commandName} ラーメン カレー 寿司`];
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args, logger } = context;
    const threadTs = getThreadTs(event);

    try {
      if (args.length === 0) {
        throw new ValidationError('No choices provided', '選択肢を指定してください。', {
          argsLength: 0,
        });
      }

      const choice = getRandomItem(args);

      await say({
        text: `選ばれたのは: *${choice}*`,
        ...(threadTs && { thread_ts: threadTs }),
      });

      logCommandSuccess(logger, 'choice', {
        user: event.user,
        choicesCount: args.length,
        selected: choice,
      });
    } catch (error) {
      await handleCommandError(error, context, 'choice');
    }
  }
}
