import { GroupSubcommandContext } from './types';

/**
 * グループを削除する
 */
export const handleDelete = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, groupService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length === 0) {
    await say({
      text: 'グループ名を指定してください。',
      ...replyOptions,
    });
    return;
  }

  const groupName = subcommandArgs[0];
  const success = groupService.deleteGroup(groupName);

  if (success) {
    await say({
      text: `グループ "${groupName}" を削除しました。`,
      ...replyOptions,
    });
  } else {
    await say({
      text: `グループ "${groupName}" は存在しません。`,
      ...replyOptions,
    });
  }
};
