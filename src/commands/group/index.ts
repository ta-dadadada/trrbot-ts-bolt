import { Command, CommandContext } from '../types';
import type { IGroupService } from '../../features/group';
import { BOT_MENTION_NAME } from '../../config/constants';
import { getReplyOptions } from '../utils';
import { GroupSubcommandHandler } from './types';
import { handleList } from './listHandler';
import { handleCreate } from './createHandler';
import { handleDelete } from './deleteHandler';
import { handleItems } from './itemsHandler';
import { handleAdd } from './addHandler';
import { handleRemove } from './removeHandler';
import { handleClear } from './clearHandler';

/**
 * サブコマンドマップ
 */
const SUBCOMMAND_MAP: Record<string, GroupSubcommandHandler> = {
  list: handleList,
  create: handleCreate,
  delete: handleDelete,
  items: handleItems,
  add: handleAdd,
  remove: handleRemove,
  clear: handleClear,
};

export { GroupChoiceCommand } from './groupChoiceCommand';
export { GroupShuffleCommand } from './groupShuffleCommand';

/**
 * グループコマンドの実装
 */
export class GroupCommand implements Command {
  description = 'グループを管理します';

  constructor(private readonly groupService: IGroupService) {}

  getExamples(commandName: string): string[] {
    return [
      `${BOT_MENTION_NAME} ${commandName} list`,
      `${BOT_MENTION_NAME} ${commandName} create グループ名`,
      `${BOT_MENTION_NAME} ${commandName} delete グループ名`,
      `${BOT_MENTION_NAME} ${commandName} items グループ名`,
      `${BOT_MENTION_NAME} ${commandName} add グループ名 アイテム1`,
      `${BOT_MENTION_NAME} ${commandName} add グループ名 アイテム1 アイテム2 アイテム3`,
      `${BOT_MENTION_NAME} ${commandName} remove グループ名 アイテム`,
      `${BOT_MENTION_NAME} ${commandName} clear グループ名`,
    ];
  }

  getHelpText(commandName: string): string {
    let text = `*${commandName}* - ${this.description}\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} list\` - すべてのグループを表示\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} create グループ名\` - 新しいグループを作成\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} delete グループ名\` - グループを削除\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} items グループ名\` - グループのアイテムを表示\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} add グループ名 アイテム...\` - アイテムを追加\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} remove グループ名 アイテム\` - アイテムを削除\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} clear グループ名\` - グループのすべてのアイテムを削除\n\n`;
    return text;
  }

  async execute(context: CommandContext): Promise<void> {
    const { say, event, args } = context;
    const replyOptions = getReplyOptions(event);

    const validSubcommands = Object.keys(SUBCOMMAND_MAP).join(', ');

    if (args.length === 0) {
      await say({
        text: `サブコマンドを指定してください（${validSubcommands}）。`,
        ...replyOptions,
      });
      return;
    }

    const [subcommand, ...subcommandArgs] = args;
    const handler = SUBCOMMAND_MAP[subcommand.toLowerCase()];

    if (!handler) {
      await say({
        text: `未知のサブコマンド: ${subcommand}\n有効なサブコマンド: ${validSubcommands}`,
        ...replyOptions,
      });
      return;
    }

    await handler({
      ...context,
      groupService: this.groupService,
      subcommandArgs,
      replyOptions,
    });
  }
}
