import { GroupSubcommandContext } from './types';
import { validateGroupName, ValidationError } from '../../utils/validation';
import { handleCommandError, logCommandSuccess } from '../../utils/errorHandler';
import { DatabaseError } from '../../utils/errors';

/**
 * グループを作成する
 */
export const handleCreate = async (context: GroupSubcommandContext): Promise<void> => {
  const { say, event, logger, groupService, subcommandArgs, replyOptions } = context;

  if (subcommandArgs.length === 0) {
    await say({
      text: 'グループ名を指定してください。',
      ...replyOptions,
    });
    return;
  }

  const groupName = subcommandArgs[0];

  try {
    // グループ名のバリデーション
    const validatedGroupName = validateGroupName(groupName);

    try {
      groupService.createGroup(validatedGroupName);
    } catch (error) {
      throw new DatabaseError('Failed to create group', {
        groupName: validatedGroupName,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await say({
      text: `グループ "${validatedGroupName}" を作成しました。`,
      ...replyOptions,
    });

    logCommandSuccess(logger, 'group-create', {
      user: event.user,
      groupName: validatedGroupName,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      await say({
        text: error.userMessage,
        ...replyOptions,
      });
      return;
    }
    await handleCommandError(error, context, 'group-create');
  }
};
