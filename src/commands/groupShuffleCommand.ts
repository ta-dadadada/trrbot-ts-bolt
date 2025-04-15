import { Command, CommandContext, getThreadTs } from './types';
import { GroupService } from '../services/groupService';
import { shuffleArray } from '../utils/random';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * グループ内のアイテムをランダムに並び替えるコマンドの実装
 */
export class GroupShuffleCommand implements Command {
  name = 'gshuffle';
  description = '指定されたグループ内のアイテムをランダムに並び替えて順序付けて返します';
  examples = [`${BOT_MENTION_NAME} gshuffle グループ名`];

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args } = context;
    const threadTs = getThreadTs(event);
    
    // グループ名が指定されていない場合はエラーメッセージを表示
    if (args.length === 0) {
      await say({
        text: `グループ名を指定してください。\n例: \`${BOT_MENTION_NAME} gshuffle グループ名\``,
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }
    
    const groupName = args[0];
    
    // グループからアイテムを取得
    const items = GroupService.getItemsByGroupName(groupName);
    
    // アイテムが存在しない場合はエラーメッセージを表示
    if (items.length === 0) {
      await say({
        text: `グループ "${groupName}" は存在しないか、アイテムがありません。`,
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }
    
    // アイテムが1つしかない場合は特別なメッセージを表示
    if (items.length === 1) {
      await say({
        text: `グループ "${groupName}" にはアイテムが1つしかありません: *${items[0].itemText}*`,
        ...(threadTs && { thread_ts: threadTs }),
      });
      return;
    }
    
    // アイテムのテキストを抽出
    const itemTexts = items.map(item => item.itemText);
    
    // アイテムをシャッフル
    const shuffledItems = shuffleArray(itemTexts);
    
    // 順序付けて結果を表示
    const resultText = shuffledItems
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n');
    
    await say({
      text: `グループ "${groupName}" のシャッフル結果:\n${resultText}`,
      ...(threadTs && { thread_ts: threadTs }),
    });
  }
}