import { describe, it, expect, vi } from 'vitest';
import { HelpCommand } from './helpCommand';
import { Command, CommandContext } from './types';
import { CommandRegistration } from './index';
import { WebClient } from '@slack/web-api';
import type { Logger } from '@slack/bolt';
import { BOT_MENTION_NAME } from '../config/constants';

describe('HelpCommand', () => {
  it('should generate help text dynamically based on available commands', async () => {
    // モックのコマンドを作成
    const mockChoiceCommand: Command = {
      description: '指定された選択肢からランダムに1つ選びます',
      getExamples: (commandName: string) => [
        `${BOT_MENTION_NAME} ${commandName} ラーメン カレー 寿司`,
      ],
      execute: vi.fn(),
    };

    const mockGroupChoiceCommand: Command = {
      description: '指定されたグループからランダムに1つのアイテムを選びます',
      getExamples: (commandName: string) => [`${BOT_MENTION_NAME} ${commandName} 食べ物`],
      execute: vi.fn(),
    };

    const mockReactionCommand: Command = {
      description: 'リアクションマッピングを管理します',
      getExamples: (commandName: string) => [
        `${BOT_MENTION_NAME} ${commandName} list`,
        `${BOT_MENTION_NAME} ${commandName} add トリガー :emoji:`,
        `${BOT_MENTION_NAME} ${commandName} remove トリガー :emoji:`,
      ],
      execute: vi.fn(),
      getHelpText: (commandName: string) => `*${commandName}* - custom help\n`,
    };

    const mockHelpCommand: Command = {
      description: 'このヘルプメッセージを表示します',
      getExamples: (commandName: string) => [`${BOT_MENTION_NAME} ${commandName}`],
      execute: vi.fn(),
    };

    const mockRegistrations: CommandRegistration[] = [
      {
        command: mockChoiceCommand,
        primaryName: 'choice',
        aliases: [],
      },
      {
        command: mockGroupChoiceCommand,
        primaryName: 'groupChoice',
        aliases: ['gc'],
        displayName: 'gc',
      },
      {
        command: mockReactionCommand,
        primaryName: 'reaction',
        aliases: [],
      },
      {
        command: mockHelpCommand,
        primaryName: 'help',
        aliases: [],
      },
    ];

    // ヘルプコマンドのインスタンスを作成
    const helpCommand = new HelpCommand();

    // コマンド登録情報を設定
    helpCommand.setCommands(mockRegistrations);

    // sayのモック関数を作成
    const mockSay = vi.fn();

    // モックのコンテキストを作成
    const mockContext: CommandContext = {
      event: {
        text: `${BOT_MENTION_NAME} help`,
        ts: '1234567890.123456',
      },
      say: mockSay,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as Partial<Logger> as Logger,
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
    expect(helpText).toContain(`${BOT_MENTION_NAME} choice ラーメン カレー 寿司`);

    expect(helpText).toContain('*gc (groupChoice)*');
    expect(helpText).toContain('指定されたグループからランダムに1つのアイテムを選びます');
    expect(helpText).toContain(`${BOT_MENTION_NAME} gc 食べ物`);

    expect(helpText).toContain('*reaction*');
    expect(helpText).toContain('custom help');

    expect(helpText).toContain('*help*');
    expect(helpText).toContain('このヘルプメッセージを表示します');
    expect(helpText).toContain(`${BOT_MENTION_NAME} help`);
  });
});
