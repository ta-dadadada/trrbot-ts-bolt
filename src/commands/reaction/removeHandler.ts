import { ReactionSubcommandContext } from './types';

/**
 * リアクションマッピングを削除する
 */
export const handleRemove = async (context: ReactionSubcommandContext): Promise<void> => {
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

  const success = reactionService.removeReactionMapping(triggerText, reaction);

  if (success) {
    await say({
      text: `リアクションマッピングを削除しました: "${triggerText}" → ${reaction}`,
      ...replyOptions,
    });
  } else {
    await say({
      text: `リアクションマッピング "${triggerText}" → ${reaction} は存在しません。`,
      ...replyOptions,
    });
  }
};
