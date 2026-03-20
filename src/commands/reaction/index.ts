import { Command, CommandContext } from '../types';
import type { IReactionService } from '../../features/reaction';
import { BOT_MENTION_NAME } from '../../config/constants';
import { getReplyOptions } from '../utils';
import { ReactionSubcommandHandler } from './types';
import { handleExport } from './exportHandler';
import { handleAdd } from './addHandler';
import { handleRemove } from './removeHandler';

/**
 * サブコマンドマップ
 */
const SUBCOMMAND_MAP: Record<string, ReactionSubcommandHandler> = {
  export: handleExport,
  add: handleAdd,
  remove: handleRemove,
};

/**
 * リアクションコマンドの実装
 */
export class ReactionCommand implements Command {
  description =
    'リアクションマッピングを管理します（チャンネルメッセージに自動的にリアクションを追加）';

  constructor(private readonly reactionService: IReactionService) {}

  getExamples(commandName: string): string[] {
    return [
      `${BOT_MENTION_NAME} ${commandName} export`,
      `${BOT_MENTION_NAME} ${commandName} add トリガー :emoji:`,
      `${BOT_MENTION_NAME} ${commandName} remove トリガー :emoji:`,
    ];
  }

  getHelpText(commandName: string): string {
    let text = `*${commandName}* - ${this.description}\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} export\` - すべてのリアクションマッピングをCSV形式でエクスポート\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} add トリガー :emoji:\` - リアクションマッピングを追加\n`;
    text += `  - \`${BOT_MENTION_NAME} ${commandName} remove トリガー :emoji:\` - リアクションマッピングを削除\n\n`;
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
      reactionService: this.reactionService,
      subcommandArgs,
      replyOptions,
    });
  }
}
