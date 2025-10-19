import { Command, CommandContext, getThreadTs } from './types';
import { GroupService } from '../services/groupService';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * グループからランダムにアイテムを選ぶコマンドの実装
 */
export class GroupChoiceCommand implements Command {
  description = '指定されたグループからランダムに1つのアイテムを選びます';

  getExamples(commandName: string): string[] {
    return [
      `${BOT_MENTION_NAME} ${commandName} 食べ物`,
      `${BOT_MENTION_NAME} ${commandName} 食べ物 - ラーメン うどん`,
    ];
  }

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args } = context;
    const threadTs = getThreadTs(event);

    if (args.length === 0) {
      await say({
        text: 'グループ名を指定してください。',
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }

    // 引数から '-' の位置を探す
    const excludeIndex = args.indexOf('-');
    let groupName: string;
    let excludeItems: string[] = [];
    let item: string | undefined;

    if (excludeIndex !== -1 && excludeIndex < args.length - 1) {
      // '-' がある場合、その前をグループ名、後ろを除外アイテムとして扱う
      groupName = args.slice(0, excludeIndex).join(' ');
      excludeItems = args.slice(excludeIndex + 1);
      item = GroupService.getRandomItemFromGroupExcluding(groupName, excludeItems);
    } else {
      // '-' がない場合は従来通りの処理
      // 複数の単語からなるグループ名に対応
      groupName = args.join(' ');
      item = GroupService.getRandomItemFromGroup(groupName);
    }

    if (!item) {
      await say({
        text: `グループ "${groupName}" は存在しないか、アイテムがありません。`,
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }

    await say({
      text: `選ばれたのは: *${item}*`,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}
