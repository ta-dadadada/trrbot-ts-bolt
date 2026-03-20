import { ReactionSubcommandContext } from './types';
import { handleCommandError } from '../../utils/errorHandler';
import { FilesUploadV2Arguments } from '@slack/web-api';
import { stringify } from 'csv-stringify/sync';

/**
 * リアクションマッピングをCSVファイルとしてエクスポートする
 */
export const handleExport = async (context: ReactionSubcommandContext): Promise<void> => {
  const { say, event, client, reactionService, replyOptions } = context;

  try {
    // リアクションマッピングを取得
    const mappings = reactionService.getAllReactionMappings();

    if (mappings.length === 0) {
      await say({
        text: 'エクスポートするリアクションマッピングはありません。',
        ...replyOptions,
      });
      return;
    }

    // CSV形式でデータをエクスポート（RFC 4180準拠）
    const csvContent = stringify(mappings, {
      header: true,
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'triggerText', header: 'トリガーテキスト' },
        { key: 'reaction', header: 'リアクション' },
        { key: 'usageCount', header: '使用回数' },
        { key: 'createdAt', header: '作成日時' },
        { key: 'updatedAt', header: '更新日時' },
      ],
    });

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
        },
      ],
      thread_ts: replyOptions.thread_ts,
    };

    await client.files.uploadV2(uploadParams);
  } catch (error) {
    await handleCommandError(error, context, 'reaction-export');
  }
};
