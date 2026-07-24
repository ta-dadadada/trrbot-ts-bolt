import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from '@slack/bolt';

vi.mock('../commands/router', () => ({
  processCommand: vi.fn(),
}));

vi.mock('../services/reactionService', () => ({
  ReactionService: {
    findMatchingMappings: vi.fn(),
    incrementReactionUsage: vi.fn(),
  },
}));

import { ReactionService } from '../services/reactionService';
import { processCommand } from '../commands/router';
import { registerMessageHandlers } from './messageHandler';

describe('registerMessageHandlers', () => {
  let listener: (args: Record<string, unknown>) => Promise<void>;
  let client: { reactions: { add: ReturnType<typeof vi.fn> } };
  let logger: {
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
  };
  let say: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const app = {
      message: vi.fn((callback: (args: Record<string, unknown>) => Promise<void>) => {
        listener = callback;
      }),
    } as unknown as App;
    client = { reactions: { add: vi.fn().mockResolvedValue({ ok: true }) } };
    logger = { error: vi.fn(), warn: vi.fn() };
    say = vi.fn().mockResolvedValue({ ok: true });
    vi.mocked(ReactionService.findMatchingMappings).mockReturnValue([]);
    registerMessageHandlers(app);
  });

  it('subtype付きメッセージを無視する', async () => {
    await listener({
      message: {
        subtype: 'bot_message',
        text: 'hello',
        channel: 'C123',
        channel_type: 'channel',
      },
      client,
      logger,
      say,
    });

    expect(ReactionService.findMatchingMappings).not.toHaveBeenCalled();
  });

  it('textのないメッセージを無視する', async () => {
    await listener({
      message: { subtype: undefined, channel: 'C123', channel_type: 'channel' },
      client,
      logger,
      say,
    });

    expect(ReactionService.findMatchingMappings).not.toHaveBeenCalled();
  });

  it('DMメッセージをコマンド処理へ委譲する', async () => {
    const message = {
      type: 'message',
      subtype: undefined,
      text: 'choice a b',
      user: 'U123',
      channel: 'D123',
      channel_type: 'im',
      event_ts: '100.000',
      ts: '100.000',
    };

    await listener({ message, client, logger, say });

    expect(processCommand).toHaveBeenCalledWith('choice a b', message, say, logger, client);
    expect(ReactionService.findMatchingMappings).not.toHaveBeenCalled();
  });

  it('チャンネルメッセージへ一意なリアクションを追加して使用回数を更新する', async () => {
    vi.mocked(ReactionService.findMatchingMappings).mockReturnValue([
      {
        id: 1,
        triggerText: 'hello',
        reaction: ':wave:',
        usageCount: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 2,
        triggerText: 'world',
        reaction: ':smile:',
        usageCount: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);

    await listener({
      message: {
        type: 'message',
        subtype: undefined,
        text: 'hello world',
        channel: 'C123',
        channel_type: 'channel',
        ts: '100.000',
      },
      client,
      logger,
      say,
    });

    expect(client.reactions.add).toHaveBeenNthCalledWith(1, {
      channel: 'C123',
      timestamp: '100.000',
      name: 'wave',
    });
    expect(client.reactions.add).toHaveBeenNthCalledWith(2, {
      channel: 'C123',
      timestamp: '100.000',
      name: 'smile',
    });
    expect(ReactionService.incrementReactionUsage).toHaveBeenCalledWith('hello', ':wave:');
    expect(ReactionService.incrementReactionUsage).toHaveBeenCalledWith('world', ':smile:');
  });

  it('リアクション追加失敗後も残りのリアクションを処理する', async () => {
    vi.mocked(ReactionService.findMatchingMappings).mockReturnValue([
      {
        id: 1,
        triggerText: 'hello',
        reaction: ':wave:',
        usageCount: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 2,
        triggerText: 'hello',
        reaction: ':smile:',
        usageCount: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]);
    client.reactions.add
      .mockRejectedValueOnce(new Error('already_reacted'))
      .mockResolvedValueOnce({ ok: true });

    await listener({
      message: {
        type: 'message',
        subtype: undefined,
        text: 'hello',
        channel: 'C123',
        channel_type: 'channel',
        ts: '100.000',
      },
      client,
      logger,
      say,
    });

    expect(client.reactions.add).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalled();
    expect(ReactionService.incrementReactionUsage).toHaveBeenCalledTimes(1);
    expect(ReactionService.incrementReactionUsage).toHaveBeenCalledWith('hello', ':smile:');
  });
});
