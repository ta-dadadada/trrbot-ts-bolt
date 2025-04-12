import { Command, CommandContext, getThreadTs } from './types';
import { GroupService } from '../services/groupService';

/**
 * グループコマンドの実装
 */
export class GroupCommand implements Command {
  name = 'group';
  description = 'グループを管理します';
  examples = [
    '@trrbot group list',
    '@trrbot group create グループ名',
    '@trrbot group delete グループ名',
    '@trrbot group items グループ名',
    '@trrbot group add グループ名 アイテム',
    '@trrbot group remove グループ名 アイテム',
    '@trrbot group clear グループ名'
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
            text: 'グループ名とアイテムを指定してください。',
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
      GroupService.createGroup(groupName);
      
      await say({
        text: `グループ "${groupName}" を作成しました。`,
        thread_ts: threadTs,
      });
    } catch (error) {
      await say({
        text: `グループの作成に失敗しました: ${(error as Error).message}`,
        thread_ts: threadTs,
      });
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
    
    // 空白で区切られた複数のアイテムを処理
    const items = itemText.split(' ').filter(item => item.trim() !== '');
    
    if (items.length === 1) {
      // 単一アイテムの場合
      const result = GroupService.addItemToGroup(groupName, items[0]);
      
      if (result !== undefined) {
        await say({
          text: `グループ "${groupName}" にアイテム "${items[0]}" を追加しました。`,
          thread_ts: threadTs,
        });
      } else {
        await say({
          text: `グループ "${groupName}" は存在しません。`,
          thread_ts: threadTs,
        });
      }
    } else if (items.length > 1) {
      // 複数アイテムの場合
      const results = GroupService.addItemsToGroup(groupName, items);
      
      if (results.length > 0) {
        await say({
          text: `グループ "${groupName}" に ${items.length} 個のアイテムを追加しました：\n${items.join('\n')}`,
          thread_ts: threadTs,
        });
      } else {
        await say({
          text: `グループ "${groupName}" は存在しません。`,
          thread_ts: threadTs,
        });
      }
    } else {
      await say({
        text: `追加するアイテムを指定してください。`,
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