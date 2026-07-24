import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { ChoiceCommand } from './choiceCommand';
import { SayFunction, SlackEvent } from './types';
import * as randomUtils from '../utils/random';

describe('ChoiceCommand', () => {
  let command: ChoiceCommand;
  let mockSay: SayFunction;
  let mockLogger: Logger;
  let mockEvent: SlackEvent;
  let mockClient: WebClient;

  beforeEach(() => {
    command = new ChoiceCommand();
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
      text: 'choice',
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
      invokedName: 'choice',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({ text: '選ばれたのは: *カレー*' });
  });

  it('選択肢がない場合はValidationErrorを送出する', async () => {
    await expect(
      command.execute({
        event: mockEvent,
        say: mockSay,
        logger: mockLogger,
        args: [],
        invokedName: 'choice',
        client: mockClient,
      }),
    ).rejects.toMatchObject({
      message: 'No choices provided',
      userMessage: '選択肢を指定してください。',
      context: { argsLength: 0 },
    });
    expect(mockSay).not.toHaveBeenCalled();
  });

  it('乱数関数へ引数をそのまま渡す', async () => {
    const getRandomItem = vi.spyOn(randomUtils, 'getRandomItem').mockReturnValue('寿司');

    await command.execute({
      event: mockEvent,
      say: mockSay,
      logger: mockLogger,
      args: ['ラーメン', 'カレー', '寿司'],
      invokedName: 'choice',
      client: mockClient,
    });

    expect(getRandomItem).toHaveBeenCalledWith(['ラーメン', 'カレー', '寿司']);
  });

  it('既存スレッドへ返信する', async () => {
    vi.spyOn(randomUtils, 'getRandomItem').mockReturnValue('ラーメン');

    await command.execute({
      event: { ...mockEvent, thread_ts: '0.999' },
      say: mockSay,
      logger: mockLogger,
      args: ['ラーメン'],
      invokedName: 'choice',
      client: mockClient,
    });

    expect(mockSay).toHaveBeenCalledWith({ text: '選ばれたのは: *ラーメン*', thread_ts: '0.999' });
  });
});
