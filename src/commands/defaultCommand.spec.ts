import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { DefaultCommand } from './defaultCommand';
import { SayFunction, SlackEvent } from './types';
import * as randomUtils from '../utils/random';

describe('DefaultCommand', () => {
  let command: DefaultCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new DefaultCommand();
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
      text: 'unknown',
    } as SlackEvent;
    mockClient = {} as WebClient;
    vi.restoreAllMocks();
  });

  it('選択結果を通常のチャンネルへ送信する', async () => {
    vi.spyOn(randomUtils, 'getRandomItem').mockReturnValue('カレー');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['ラーメン', 'カレー'],
      invokedName: 'default',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({ text: '選ばれたのは: *カレー*' });
  });

  it('空入力ではヘルプ案内を送信する', async () => {
    const getRandomItem = vi.spyOn(randomUtils, 'getRandomItem');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: [],
      invokedName: 'default',
      client: mockClient,
    });

    expect(getRandomItem).not.toHaveBeenCalled();
    expect(mockSay).toHaveBeenCalledWith({ text: "'help'コマンドでヘルプを表示できます。" });
  });

  it('空白を除いた選択肢を乱数関数へ渡す', async () => {
    const getRandomItem = vi.spyOn(randomUtils, 'getRandomItem').mockReturnValue('寿司');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['ラーメン', '', '寿司'],
      invokedName: 'default',
      client: mockClient,
    });

    expect(getRandomItem).toHaveBeenCalledWith(['ラーメン', '寿司']);
  });

  it('既存スレッドへ返信する', async () => {
    vi.spyOn(randomUtils, 'getRandomItem').mockReturnValue('ラーメン');

    await command.execute({
      event: { ...mockEvent, thread_ts: '0.999' },
      say: mockSay,
      logger: mockLogger,
      args: ['ラーメン'],
      invokedName: 'default',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({ text: '選ばれたのは: *ラーメン*', thread_ts: '0.999' });
  });
});
