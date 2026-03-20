import { GroupSubcommandContext } from './types';

/**
 * グループのすべてのアイテムを削除する
 */
export const handleClear = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, groupService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length === 0) {
    await say({
      text: 'グループ名を指定してください。',
      ...replyOptions,
    });
    return;
  }

  const groupName = subcommandArgs[0];
  const success = groupService.clearGroupItems(groupName);

  if (success) {
    await say({
      text: `グループ "${groupName}" のすべてのアイテムを削除しました。`,
      ...replyOptions,
    });
  } else {
    await say({
      text: `グループ "${groupName}" は存在しません。`,
      ...replyOptions,
    });
  }
};
