import { Command, CommandContext, getThreadTs } from './types';
import { GroupService } from '../services/groupService';

/**
 * グループからランダムにアイテムを選ぶコマンドの実装
 */
export class GroupChoiceCommand implements Command {
  name = 'gc';
  description = '指定されたグループからランダムに1つのアイテムを選びます';
  examples = ['@trrbot gc 食べ物'];

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
    
    const groupName = args[0];
    const item = GroupService.getRandomItemFromGroup(groupName);
    
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