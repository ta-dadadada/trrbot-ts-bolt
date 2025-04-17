import { Command, CommandContext, getThreadTs } from './types';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * ヘルプコマンドの実装
 */
export class HelpCommand implements Command {
  name = 'help';
  description = 'このヘルプメッセージを表示します';
  examples = [`${BOT_MENTION_NAME} help`];
  
  // 外部から注入されるコマンド一覧
  private commands: Command[] = [];
  
  /**
   * コマンド一覧を設定する
   * @param commands コマンド一覧
   */
  setCommands(commands: Command[]): void {
    this.commands = commands;
  }

  /**
   * コマンドのヘルプテキストを生成する
   * @param command コマンド
   * @returns フォーマットされたヘルプテキスト
   */
  private generateCommandHelpText(command: Command): string {
    let helpText = `*${command.name}* - ${command.description}`;
    
    // 例がある場合は追加
    if (command.examples && command.examples.length > 0) {
      // サブコマンドを持つ複雑なコマンド（例：reaction, group）の場合
      if (command.examples.length > 1 &&
          (command.examples.some(ex => ex.includes(' list')) ||
           command.examples.some(ex => ex.includes(' add')))) {
        helpText += '\n';
        command.examples.forEach(example => {
          // 例からサブコマンドとパラメータを抽出
          const parts = example.split(' ');
          if (parts.length >= 3) {
            const subCommand = parts[2]; // BOT_MENTION_NAME command subcommand
            // パラメータ部分は現在未使用
            helpText += `  - \`${example}\` - `;
            
            // サブコマンドに基づいて説明を追加
            switch (subCommand) {
              case 'list':
                helpText += `すべての${command.name === 'reaction' ? 'リアクションマッピング' : 'グループ'}を表示`;
                break;
              case 'add':
                helpText += `${command.name === 'reaction' ? 'リアクションマッピング' : 'アイテム'}を追加`;
                break;
              case 'remove':
                helpText += `${command.name === 'reaction' ? 'リアクションマッピング' : 'アイテム'}を削除`;
                break;
              case 'create':
                helpText += '新しいグループを作成';
                break;
              case 'delete':
                helpText += 'グループを削除';
                break;
              case 'items':
                helpText += 'グループのアイテムを表示';
                break;
              case 'clear':
                helpText += 'グループのすべてのアイテムを削除';
                break;
              default:
                helpText += subCommand;
            }
          }
          helpText += '\n';
        });
      } else {
        // 単純なコマンドの場合
        helpText += `\n  例: \`${command.examples[0]}\``;
        
        // 追加の例がある場合（diceコマンドなど）
        if (command.examples.length > 1 && command.name === 'dice') {
          helpText += `, \`${command.examples[2]}\``;
        }
      }
    }
    
    return helpText;
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say } = context;
    const threadTs = getThreadTs(event);
    // コマンド一覧を使用
    const commands = this.commands;
    
    
    // ヘルプテキストのヘッダー
    let helpText = `\n*使用可能なコマンド:*\n\n`;
    
    // 各コマンドのヘルプテキストを生成
    commands.forEach(command => {
      // 特殊なコマンド（例：zakoSecretやsecret）は表示しない
      if (command.name.includes('secret')) {
        return;
      }
      
      // groupChoiceコマンドはgcとして表示
      if (command.name === 'groupChoice') {
        helpText += `*gc* - ${command.description}\n`;
        helpText += `  例: \`${command.examples[0].replace('groupChoice', 'gc')}\`\n\n`;
        return;
      }
      
      // groupShuffleコマンドはgsとして表示
      if (command.name === 'groupShuffle') {
        helpText += `*gs* - ${command.description}\n`;
        helpText += `  例: \`${command.examples[0].replace('groupShuffle', 'gs')}\`\n\n`;
        return;
      }
      
      helpText += this.generateCommandHelpText(command) + '\n\n';
    });
    
    await say({
      text: helpText,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}