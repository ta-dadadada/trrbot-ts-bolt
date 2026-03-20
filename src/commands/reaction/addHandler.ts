import { ReactionSubcommandContext } from './types';
import { validateTriggerText, ValidationError } from '../../utils/validation';
import { handleCommandError } from '../../utils/errorHandler';

/**
 * リアクションマッピングを追加する
 */
export const handleAdd = async (context: ReactionSubcommandContext): Promise<void> => {
  const { say, reactionService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length < 2) {
    await say({
      text: 'トリガーテキストとリアクションを指定してください。',
      ...replyOptions,
    });
    return;
  }

  const triggerText = subcommandArgs[0];
  const reaction = subcommandArgs[1];

  try {
    // トリガーテキストのバリデーション
    const validatedTriggerText = validateTriggerText(triggerText);

    reactionService.addReactionMapping(validatedTriggerText, reaction);

    await say({
      text: `リアクションマッピングを追加しました: "${validatedTriggerText}" → ${reaction}`,
      ...replyOptions,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      await say({
        text: `バリデーションエラー: ${error.message}`,
        ...replyOptions,
      });
    } else {
      await handleCommandError(error, context, 'reaction-add');
    }
  }
};
