import { Command, CommandContext, getThreadTs } from './types';
import { ReactionService } from '../services/reactionService';
import { FilesUploadV2Arguments } from '@slack/web-api';
import { BOT_MENTION_NAME } from '../config/constants';

/**
 * リアクションコマンドの実装
 */
export class ReactionCommand implements Command {
  name = 'reaction';
  description = 'リアクションマッピングを管理します';
  examples = [
    `${BOT_MENTION_NAME} reaction export`,
    `${BOT_MENTION_NAME} reaction add トリガー :emoji:`,
    `${BOT_MENTION_NAME} reaction remove トリガー :emoji:`
  ];

  async execute(context: CommandContext): Promise<void> {
    const { event, say, args } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    if (args.length === 0) {
      await say({
        text: 'サブコマンドを指定してください（list, add, remove）。',
        thread_ts: threadTs,
      });
      return;
    }
    
    const subCommand = args[0].toLowerCase();
    
    switch (subCommand) {
      case 'export':
        await this.handleExport(context);
        break;
        
      case 'add':
        if (args.length < 3) {
          await say({
            text: 'トリガーテキストとリアクションを指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleAdd(context, args[1], args[2]);
        break;
        
      case 'remove':
        if (args.length < 3) {
          await say({
            text: 'トリガーテキストとリアクションを指定してください。',
            thread_ts: threadTs,
          });
          return;
        }
        await this.handleRemove(context, args[1], args[2]);
        break;
        
      default:
        await say({
          text: `未知のサブコマンド: ${subCommand}\n有効なサブコマンド: list, add, remove`,
          thread_ts: threadTs,
        });
    }
  }


  /**
   * リアクションマッピングを追加する
   */
  private async handleAdd(context: CommandContext, triggerText: string, reaction: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    try {
      ReactionService.addReactionMapping(triggerText, reaction);
      
      await say({
        text: `リアクションマッピングを追加しました: "${triggerText}" → ${reaction}`,
        thread_ts: threadTs,
      });
    } catch (error) {
      await say({
        text: `リアクションマッピングの追加に失敗しました: ${(error as Error).message}`,
        thread_ts: threadTs,
      });
    }
  }

  /**
   * リアクションマッピングを削除する
   */
  private async handleRemove(context: CommandContext, triggerText: string, reaction: string): Promise<void> {
    const { event, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    const success = ReactionService.removeReactionMapping(triggerText, reaction);
    
    if (success) {
      await say({
        text: `リアクションマッピングを削除しました: "${triggerText}" → ${reaction}`,
        thread_ts: threadTs,
      });
    } else {
      await say({
        text: `リアクションマッピング "${triggerText}" → ${reaction} は存在しません。`,
        thread_ts: threadTs,
      });
    }
  }

  /**
   * リアクションマッピングをCSVファイルとしてエクスポートする
   */
  private async handleExport(context: CommandContext): Promise<void> {
    const { event, client, say } = context;
    // スレッドのタイムスタンプが存在しない場合は、イベントのタイムスタンプを使用
    const threadTs = getThreadTs(event) || event.ts;
    
    try {
      // リアクションマッピングを取得
      const mappings = ReactionService.getAllReactionMappings();
      
      if (mappings.length === 0) {
        await say({
          text: 'エクスポートするリアクションマッピングはありません。',
          thread_ts: threadTs,
        });
        return;
      }
      
      // CSVヘッダー
      const csvHeader = 'ID,トリガーテキスト,リアクション,使用回数,作成日時,更新日時\n';
      
      // CSVデータ行の生成
      const csvRows = mappings.map(mapping => {
        // CSVフォーマットに合わせてエスケープ処理
        const escapedTrigger = `"${mapping.triggerText.replace(/"/g, '""')}"`;
        return `${mapping.id},${escapedTrigger},${mapping.reaction},${mapping.usageCount},${mapping.createdAt},${mapping.updatedAt}`;
      });
      
      // CSVデータの結合
      const csvContent = csvHeader + csvRows.join('\n');
      
      // 現在の日時を取得してファイル名に使用
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `reaction-mappings-${timestamp}.csv`;
      // Slackにファイルをアップロード（uploadV2を使用）
      const uploadParams: FilesUploadV2Arguments = {
        channel_id: event.channel,
        initial_comment: 'リアクションマッピングをCSVファイルとしてエクスポートしました。',
        file_uploads: [
          {
            file: Buffer.from(csvContent, 'utf-8'),
            filename,
            title: 'リアクションマッピング一覧',
          }
        ]
      };
      
      // スレッドのタイムスタンプが存在する場合のみ追加
      if (threadTs) {
        uploadParams.thread_ts = threadTs;
      }
      
      await client.files.uploadV2(uploadParams);
      
    } catch (error) {
      await say({
        text: `リアクションマッピングのエクスポートに失敗しました: ${(error as Error).message}`,
        thread_ts: threadTs,
      });
    }
  }
}