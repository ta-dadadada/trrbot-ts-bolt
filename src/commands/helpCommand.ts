import { Command, CommandContext, getThreadTs } from './types';
import type { CommandRegistration } from './index';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * ヘルプコマンドの実装
 */
export class HelpCommand implements Command {
  description = 'このヘルプメッセージを表示します';

  constructor(private readonly getRegistrations: () => readonly CommandRegistration[]) {}

  getExamples(commandName: string): string[] {
    return [`${BOT_MENTION_NAME} ${commandName}`];
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say } = context;
    const threadTs = getThreadTs(event);

    // ヘルプテキストのヘッダー
    let helpText = `\n*使用可能なコマンド:*\n`;
    helpText += `_ヒント: DMではメンション不要でコマンドを実行できます_\n\n`;

    // 各コマンドのヘルプテキストを生成
    for (const reg of this.getRegistrations()) {
      // カスタムヘルプテキストがある場合はそれを使用
      if (reg.command.getHelpText) {
        const displayName = reg.displayName || reg.primaryName;
        helpText += reg.command.getHelpText(displayName);
      } else {
        // 標準フォーマット
        const displayName = reg.displayName || reg.primaryName;

        // エイリアスやDM専用の表示
        let nameDisplay: string;
        if (reg.dmOnly) {
          nameDisplay = `*${displayName} (DM専用)*`;
        } else if (reg.aliases.length > 0 && reg.displayName) {
          // primaryNameと全エイリアスを表示
          const allNames = [reg.primaryName, ...reg.aliases].filter((name) => name !== displayName);
          nameDisplay = `*${displayName} (${allNames.join(', ')})*`;
        } else {
          nameDisplay = `*${displayName}*`;
        }

        helpText += `${nameDisplay} - ${reg.command.description}\n`;

        const examples = reg.command.getExamples(displayName);
        if (examples.length > 0) {
          const indexes = reg.helpExampleIndexes ?? [0];
          const displayedExamples = indexes
            .map((index) => examples[index])
            .filter((example): example is string => example !== undefined);
          if (displayedExamples.length > 0) {
            helpText += `  例: ${displayedExamples
              .map((example) => `\`${example}\``)
              .join(', ')}\n`;
          }
        }

        helpText += '\n';
      }
    }

    await say({
      text: helpText,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}
