import { GroupSubcommandContext } from './types';

/**
 * グループからアイテムを削除する
 */
export const handleRemove = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, groupService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length < 2) {
    await say({
      text: 'グループ名とアイテムを指定してください。',
      ...replyOptions,
    });
    return;
  }

  const groupName = subcommandArgs[0];
  const itemText = subcommandArgs.slice(1).join(' ');

  const success = groupService.removeItemFromGroup(groupName, itemText);

  if (success) {
    await say({
      text: `グループ "${groupName}" からアイテム "${itemText}" を削除しました。`,
      ...replyOptions,
    });
  } else {
    await say({
      text: `グループ "${groupName}" またはアイテム "${itemText}" は存在しません。`,
      ...replyOptions,
    });
  }
};
