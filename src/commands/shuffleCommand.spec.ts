import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { BOT_MENTION_NAME } from '../config/constants';
import { ShuffleCommand } from './shuffleCommand';
import { SayFunction, SlackEvent } from './types';
import * as randomUtils from '../utils/random';

describe('ShuffleCommand', () => {
  let command: ShuffleCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;
  const insufficientItemsMessage = `並び替える項目を2つ以上指定してください。\n例: \`${BOT_MENTION_NAME} shuffle A B C D\``;

  beforeEach(() => {
    command = new ShuffleCommand();
    mockSay = vi.fn().mockResolvedValue({ ok: true, channel: 'C123', ts: '1.000' });
    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      setLevel: vi.fn(),
      getLevel: vi.fn(),
      setName: vi.fn(),
    } as Logger;
    mockEvent = {
      type: 'message',
      user: 'U123',
      channel: 'C123',
      channel_type: 'channel',
      event_ts: '1.000',
      ts: '1.000',
      text: 'shuffle',
    } as SlackEvent;
    mockClient = {} as WebClient;
    vi.restoreAllMocks();
  });

  it.each([[[]], [['A']]])('引数が%jの場合は不足メッセージを送信する', async (args) => {
    const shuffleArray = vi.spyOn(randomUtils, 'shuffleArray');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args,
      invokedName: 'shuffle',
      client: mockClient,
    });

    expect(shuffleArray).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({ text: insufficientItemsMessage });
  });

  it('複数の結果を番号付きで通常のチャンネルへ送信する', async () => {
    vi.spyOn(randomUtils, 'shuffleArray').mockReturnValue(['C', 'A', 'B']);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['A', 'B', 'C'],
      invokedName: 'shuffle',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({ text: 'シャッフル結果:\n1. C\n2. A\n3. B' });
  });

  it('乱数関数へ引数をそのまま渡す', async () => {
    const shuffleArray = vi.spyOn(randomUtils, 'shuffleArray').mockReturnValue(['B', 'A']);

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['A', 'B'],
      invokedName: 'shuffle',
      client: mockClient,
    });

    expect(shuffleArray).toHaveBeenCalledWith(['A', 'B']);
  });

  it('既存スレッドへ返信する', async () => {
    vi.spyOn(randomUtils, 'shuffleArray').mockReturnValue(['B', 'A']);

    await command.execute({
      event: { ...mockEvent, thread_ts: '0.999' },
      say: mockSay,
      logger: mockLogger,
      args: ['A', 'B'],
      invokedName: 'shuffle',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({
      text: 'シャッフル結果:\n1. B\n2. A',
      thread_ts: '0.999',
    });
  });
});
