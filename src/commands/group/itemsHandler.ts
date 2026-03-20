import { GroupSubcommandContext } from './types';

/**
 * グループのアイテム一覧を表示する
 */
export const handleItems = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, groupService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length === 0) {
    await say({
      text: 'グループ名を指定してください。',
      ...replyOptions,
    });
    return;
  }

  const groupName = subcommandArgs[0];
  const items = groupService.getItemsByGroupName(groupName);

  if (items.length === 0) {
    await say({
      text: `グループ "${groupName}" にはアイテムがありません。`,
      ...replyOptions,
    });
    return;
  }

  const itemTexts = items.map((item) => item.itemText);

  await say({
    text: `*グループ "${groupName}" のアイテム:*\n${itemTexts.join('\n')}`,
    ...replyOptions,
  });
};
