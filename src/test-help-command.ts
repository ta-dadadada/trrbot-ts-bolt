import { HelpCommand } from './commands/helpCommand';
import { CommandContext } from './commands/types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { BOT_MENTION_NAME } from './config/constants';

/**
 * ヘルプコマンドのテスト用スクリプト
 */
async function testHelpCommand(): Promise<void> {
  // ヘルプコマンドのインスタンスを作成
  const helpCommand = new HelpCommand();

  // モックのコンテキストを作成
  const mockContext: CommandContext = {
    event: {
      type: 'message',
      subtype: undefined,
      user: 'U123456',
      channel: 'C123456',
      channel_type: 'channel',
      event_ts: '1234567890.123456',
      text: `${BOT_MENTION_NAME} help`,
      ts: '1234567890.123456',
    },
    say: async (message) => {
      console.log('=== ヘルプメッセージ ===');
      if (typeof message === 'string') {
        console.log(message);
      } else {
        console.log(message.text);
      }
      console.log('=== ヘルプメッセージ終了 ===');
      return {
        ok: true,
        channel: 'C123456',
        ts: '1234567890.123456',
      };
    },
    logger: {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    } as Logger,
    args: [],
    client: {} as WebClient, // モックのWebClientを追加
  };

  // ヘルプコマンドを実行
  await helpCommand.execute(mockContext);
}

// テストを実行
testHelpCommand().catch(console.error);
