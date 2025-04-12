import { describe, it, expect, vi } from 'vitest';
import { HelpCommand } from './helpCommand';
import { CommandContext } from './types';
import { WebClient } from '@slack/web-api';

describe('HelpCommand', () => {
  it('should generate help text dynamically based on available commands', async () => {
    // モックのコマンドを作成
    const mockCommands = [
      {
        name: 'choice',
        description: '指定された選択肢からランダムに1つ選びます',
        examples: ['@trrbot choice ラーメン カレー 寿司']
      },
      {
        name: 'groupChoice',
        description: '指定されたグループからランダムに1つのアイテムを選びます',
        examples: ['@trrbot groupChoice 食べ物']
      },
      {
        name: 'reaction',
        description: 'リアクションマッピングを管理します',
        examples: [
          '@trrbot reaction list',
          '@trrbot reaction add トリガー :emoji:',
          '@trrbot reaction remove トリガー :emoji:'
        ]
      },
      {
        name: 'help',
        description: 'このヘルプメッセージを表示します',
        examples: ['@trrbot help']
      }
    ];

    // ヘルプコマンドのインスタンスを作成
    const helpCommand = new HelpCommand();
    
    // コマンド一覧を設定
    helpCommand.setCommands(mockCommands as any);

    // sayのモック関数を作成
    const mockSay = vi.fn();

    // モックのコンテキストを作成
    const mockContext: CommandContext = {
      event: {
        text: '@trrbot help',
        ts: '1234567890.123456',
      },
      say: mockSay,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as any,
      args: [],
      client: {} as WebClient,
    };

    // ヘルプコマンドを実行
    await helpCommand.execute(mockContext);

    // sayが呼び出されたことを確認
    expect(mockSay).toHaveBeenCalled();

    // sayに渡されたテキストを取得
    const helpText = mockSay.mock.calls[0][0].text;

    // 各コマンドの情報がヘルプテキストに含まれていることを確認
    expect(helpText).toContain('*choice*');
    expect(helpText).toContain('指定された選択肢からランダムに1つ選びます');
    expect(helpText).toContain('@trrbot choice ラーメン カレー 寿司');

    expect(helpText).toContain('*gc*');
    expect(helpText).toContain('指定されたグループからランダムに1つのアイテムを選びます');
    expect(helpText).toContain('@trrbot gc 食べ物');

    expect(helpText).toContain('*reaction*');
    expect(helpText).toContain('リアクションマッピングを管理します');
    expect(helpText).toContain('@trrbot reaction list');
    expect(helpText).toContain('@trrbot reaction add トリガー :emoji:');
    expect(helpText).toContain('@trrbot reaction remove トリガー :emoji:');

    expect(helpText).toContain('*help*');
    expect(helpText).toContain('このヘルプメッセージを表示します');
    expect(helpText).toContain('@trrbot help');
  });
});