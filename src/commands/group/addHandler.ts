import { GroupSubcommandContext } from './types';
import { validateItemText, ValidationError } from '../../utils/validation';
import { handleCommandError } from '../../utils/errorHandler';

/**
 * グループにアイテムを追加する
 */
export const handleAdd = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, groupService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length < 2) {
    await say({
      text: 'グループ名と1つ以上のアイテムを指定してください。複数のアイテムを一度に追加することもできます。',
      ...replyOptions,
    });
    return;
  }

  const groupName = subcommandArgs[0];
  const items = subcommandArgs.slice(1).filter((item) => item.trim() !== '');

  try {
    // 各アイテムをバリデーション
    const validatedItems: string[] = [];
    for (const item of items) {
      try {
        const validated = validateItemText(item);
        validatedItems.push(validated);
      } catch (error) {
        if (error instanceof ValidationError) {
          await say({
            text: `アイテム "${item}" のバリデーションエラー: ${error.message}`,
            ...replyOptions,
          });
          return;
        }
        throw error;
      }
    }

    if (validatedItems.length === 1) {
      // 単一アイテムの場合
      const result = groupService.addItemToGroup(groupName, validatedItems[0]);

      if (result !== undefined) {
        await say({
          text: `グループ "${groupName}" にアイテム "${validatedItems[0]}" を追加しました。`,
          ...replyOptions,
        });
      } else {
        await say({
          text: `グループ "${groupName}" は存在しません。`,
          ...replyOptions,
        });
      }
    } else {
      // 複数アイテムの場合
      const results = groupService.addItemsToGroup(groupName, validatedItems);

      if (results.length > 0) {
        await say({
          text: `グループ "${groupName}" に ${validatedItems.length} 個のアイテムを追加しました：\n${validatedItems.join('\n')}`,
          ...replyOptions,
        });
      } else {
        await say({
          text: `グループ "${groupName}" は存在しません。`,
          ...replyOptions,
        });
      }
    }
  } catch (error) {
    await handleCommandError(error, context, 'group-add');
  }
};
