import { GroupSubcommandContext } from './types';

/**
 * グループ一覧を表示する
 */
export const handleList = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, groupService, replyOptions } = context;

  const groups = groupService.getAllGroups();

  if (groups.length === 0) {
    await say({ text: 'グループはありません。', ...replyOptions });
    return;
  }

  const groupTexts = groups.map((group) => group.name);

  await say({
    text: `*グループ一覧:*\n${groupTexts.join('\n')}`,
    ...replyOptions,
  });
};
