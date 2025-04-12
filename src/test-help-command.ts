import { HelpCommand } from './commands/helpCommand';
import { CommandContext } from './commands/types';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

/**
 * ヘルプコマンドのテスト用スクリプト
 */
async function testHelpCommand(): Promise<void> {
  // ヘルプコマンドのインスタンスを作成
  const helpCommand = new HelpCommand();
  
  // モックのコンテキストを作成
  const mockContext: CommandContext = {
    event: {
      text: '@trrbot help',
      ts: '1234567890.123456',
    },
    say: async (message) => {
      console.log('=== ヘルプメッセージ ===');
      console.log(message.text);
      console.log('=== ヘルプメッセージ終了 ===');
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