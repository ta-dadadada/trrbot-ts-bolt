import { Command, CommandContext, getThreadTs } from './types';
import { GroupService } from '../services/groupService';
import { BOT_MENTION_NAME } from '../config/constants';
import { validateGroupName, validateItemText, ValidationError } from '../utils/validation';

/**
 * グループコマンドの実装
 */
export class GroupCommand implements Command {
  name = 'group';
  description = 'グループを管理します';
  examples = [
    `${BOT_MENTION_NAME} group list`,
    `${BOT_MENTION_NAME} group create グループ名`,
    `${BOT_MENTION_NAME} group delete グループ名`,
    `${BOT_MENTION_NAME} group items グループ名`,
    `${BOT_MENTION_NAME} group add グループ名 アイテム1`,
    `${BOT_MENTION_NAME} group add グループ名 アイテム1 アイテム2 アイテム3`,
    `${BOT_MENTION_NAME} group remove グループ名 アイテム`,
    `${BOT_MENTION_NAME} group clear グループ名`
  ];

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    if (args.length === 0) {
      await say({
        text: 'サブコマンドを指定してください（list, create, delete, items, add, remove, clear）。',
        thread_ts: threadTs,
      });
      return;
    }
    
    const subCommand = args[0].toLowerCase();
    
    switch (subCommand) {
      case 'list':
        await this.handleList(context);
        break;
        
      case 'create':
        if (args.length < 2) {
          await say({
            text: 'グループ名を指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleCreate(context, args[1]);
        break;
        
      case 'delete':
        if (args.length < 2) {
          await say({
            text: 'グループ名を指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleDelete(context, args[1]);
        break;
        
      case 'items':
        if (args.length < 2) {
          await say({
            text: 'グループ名を指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleItems(context, args[1]);
        break;
        
      case 'add':
        if (args.length < 3) {
          await say({
            text: 'グループ名と1つ以上のアイテムを指定してください。複数のアイテムを一度に追加することもできます。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleAdd(context, args[1], args.slice(2).join(' '));
        break;
        
      case 'remove':
        if (args.length < 3) {
          await say({
            text: 'グループ名とアイテムを指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleRemove(context, args[1], args.slice(2).join(' '));
        break;
        
      case 'clear':
        if (args.length < 2) {
          await say({
            text: 'グループ名を指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleClear(context, args[1]);
        break;
        
      default:
        await say({
          text: `未知のサブコマンド: ${subCommand}\n有効なサブコマンド: list, create, delete, items, add, remove, clear`,
          thread_ts: threadTs,
        });
    }
  }

  /**
   * グループ一覧を表示する
   */
  private async handleList(context: CommandContext): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    const groups = GroupService.getAllGroups();
    
    if (groups.length === 0) {
      await say({
        text: 'グループはありません。',
        thread_ts: threadTs,
      });
      return;
    }
    
    const groupTexts = groups.map(group => group.name);
    
    await say({
      text: `*グループ一覧:*\n${groupTexts.join('\n')}`,
      thread_ts: threadTs,
    });
  }

  /**
   * グループを作成する
   */
  private async handleCreate(context: CommandContext, groupName: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;

    try {
      // グループ名のバリデーション
      const validatedGroupName = validateGroupName(groupName);

      GroupService.createGroup(validatedGroupName);

      await say({
        text: `グループ "${validatedGroupName}" を作成しました。`,
        thread_ts: threadTs,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        await say({
          text: `バリデーションエラー: ${error.message}`,
          thread_ts: threadTs,
        });
      } else {
        await say({
          text: `グループの作成に失敗しました: ${(error as Error).message}`,
          thread_ts: threadTs,
        });
      }
    }
  }

  /**
   * グループを削除する
   */
  private async handleDelete(context: CommandContext, groupName: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    const success = GroupService.deleteGroup(groupName);
    
    if (success) {
      await say({
        text: `グループ "${groupName}" を削除しました。`,
        thread_ts: threadTs,
      });
    } else {
      await say({
        text: `グループ "${groupName}" は存在しません。`,
        thread_ts: threadTs,
      });
    }
  }

  /**
   * グループのアイテム一覧を表示する
   */
  private async handleItems(context: CommandContext, groupName: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    const items = GroupService.getItemsByGroupName(groupName);
    
    if (items.length === 0) {
      await say({
        text: `グループ "${groupName}" にはアイテムがありません。`,
        thread_ts: threadTs,
      });
      return;
    }
    
    const itemTexts = items.map(item => item.itemText);
    
    await say({
      text: `*グループ "${groupName}" のアイテム:*\n${itemTexts.join('\n')}`,
      thread_ts: threadTs,
    });
  }

  /**
   * グループにアイテムを追加する
   */
  private async handleAdd(context: CommandContext, groupName: string, itemText: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;

    try {
      // 空白で区切られた複数のアイテムを処理
      const items = itemText.split(' ').filter(item => item.trim() !== '');

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
              thread_ts: threadTs,
            });
            return;
          }
          throw error;
        }
      }

      if (validatedItems.length === 1) {
        // 単一アイテムの場合
        const result = GroupService.addItemToGroup(groupName, validatedItems[0]);

        if (result !== undefined) {
          await say({
            text: `グループ "${groupName}" にアイテム "${validatedItems[0]}" を追加しました。`,
            thread_ts: threadTs,
          });
        } else {
          await say({
            text: `グループ "${groupName}" は存在しません。`,
            thread_ts: threadTs,
          });
        }
      } else {
        // 複数アイテムの場合
        const results = GroupService.addItemsToGroup(groupName, validatedItems);

        if (results.length > 0) {
          await say({
            text: `グループ "${groupName}" に ${validatedItems.length} 個のアイテムを追加しました：\n${validatedItems.join('\n')}`,
            thread_ts: threadTs,
          });
        } else {
          await say({
            text: `グループ "${groupName}" は存在しません。`,
            thread_ts: threadTs,
          });
        }
      }
    } catch (error) {
      await say({
        text: `アイテムの追加に失敗しました: ${(error as Error).message}`,
        thread_ts: threadTs,
      });
    }
  }

  /**
   * グループからアイテムを削除する
   */
  private async handleRemove(context: CommandContext, groupName: string, itemText: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    const success = GroupService.removeItemFromGroup(groupName, itemText);
    
    if (success) {
      await say({
        text: `グループ "${groupName}" からアイテム "${itemText}" を削除しました。`,
        thread_ts: threadTs,
      });
    } else {
      await say({
        text: `グループ "${groupName}" またはアイテム "${itemText}" は存在しません。`,
        thread_ts: threadTs,
      });
    }
  }

  /**
   * グループのすべてのアイテムを削除する
   */
  private async handleClear(context: CommandContext, groupName: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    const success = GroupService.clearGroupItems(groupName);
    
    if (success) {
      await say({
        text: `グループ "${groupName}" のすべてのアイテムを削除しました。`,
        thread_ts: threadTs,
      });
    } else {
      await say({
        text: `グループ "${groupName}" は存在しません。`,
        thread_ts: threadTs,
      });
    }
  }
}