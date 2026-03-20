import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IReactionService } from '../features/reaction';
import type { ReactionMapping } from '../features/reaction/entities';

// Mock the mentionHandler's processCommand
vi.mock('./mentionHandler', () => ({
  processCommand: vi.fn(),
}));

import { processCommand } from './mentionHandler';
import { registerMessageHandlers } from './messageHandler';
import { App } from '@slack/bolt';

describe('messageHandler', () => {
  let mockReactionService: IReactionService;
  let messageCallback: (args: Record<string, unknown>) => Promise<void>;
  let mockClient: {
    reactions: { add: ReturnType<typeof vi.fn> };
  };
  let mockLogger: {
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
  let mockSay: ReturnType<typeof vi.fn>;

  const sampleMappings: ReactionMapping[] = [
    {
      id: 1,
      triggerText: 'hello',
      reaction: ':wave:',
      usageCount: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: 2,
      triggerText: 'hello',
      reaction: ':smile:',
      usageCount: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockReactionService = {
      getMatchingMappings: vi.fn().mockReturnValue([]),
      addReactionMapping: vi.fn(),
      removeReactionMapping: vi.fn(),
      getAllReactionMappings: vi.fn(),
      incrementReactionUsage: vi.fn(),
    };

    mockClient = {
      reactions: { add: vi.fn().mockResolvedValue({ ok: true }) },
    };

    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    mockSay = vi.fn().mockResolvedValue({ ok: true });

    // Capture the message callback registered with app.message()
    const mockApp = {
      message: vi.fn((callback: (args: Record<string, unknown>) => Promise<void>) => {
        messageCallback = callback;
      }),
    } as unknown as App;

    registerMessageHandlers(mockApp, mockReactionService);
  });

  it('subtypeのあるメッセージは無視する', async () => {
    await messageCallback({
      message: { subtype: 'bot_message', text: 'hello', channel: 'C123', channel_type: 'channel' },
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockReactionService.getMatchingMappings).not.toHaveBeenCalled();
  });

  it('textのないメッセージは無視する', async () => {
    await messageCallback({
      message: { subtype: undefined, channel: 'C123', channel_type: 'channel' },
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockReactionService.getMatchingMappings).not.toHaveBeenCalled();
  });

  it('DMメッセージはprocessCommandに委譲する', async () => {
    const message = {
      subtype: undefined,
      text: 'choice a b c',
      channel: 'D123',
      channel_type: 'im',
      user: 'U123',
      event_ts: '123.456',
      ts: '123.456',
      type: 'message',
    };

    await messageCallback({
      message,
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(processCommand).toHaveBeenCalledWith(
      'choice a b c',
      message,
      mockSay,
      mockLogger,
      mockClient,
    );
    expect(mockReactionService.getMatchingMappings).not.toHaveBeenCalled();
  });

  it('チャンネルメッセージでマッチするリアクションを追加する', async () => {
    vi.mocked(mockReactionService.getMatchingMappings).mockReturnValue(sampleMappings);

    const message = {
      subtype: undefined,
      text: 'hello world',
      channel: 'C123',
      channel_type: 'channel',
      ts: '123.456',
      type: 'message',
    };

    await messageCallback({
      message,
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockReactionService.getMatchingMappings).toHaveBeenCalledWith('hello world');
    expect(mockClient.reactions.add).toHaveBeenCalledTimes(2);
    expect(mockClient.reactions.add).toHaveBeenCalledWith({
      channel: 'C123',
      timestamp: '123.456',
      name: 'wave',
    });
    expect(mockClient.reactions.add).toHaveBeenCalledWith({
      channel: 'C123',
      timestamp: '123.456',
      name: 'smile',
    });
  });

  it('リアクション追加後にusageCountをインクリメントする', async () => {
    vi.mocked(mockReactionService.getMatchingMappings).mockReturnValue([sampleMappings[0]]);

    await messageCallback({
      message: {
        subtype: undefined,
        text: 'hello',
        channel: 'C123',
        channel_type: 'channel',
        ts: '123.456',
        type: 'message',
      },
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockReactionService.incrementReactionUsage).toHaveBeenCalledWith('hello', ':wave:');
  });

  it('重複するリアクションは1回だけ追加される', async () => {
    const duplicateMappings: ReactionMapping[] = [
      { ...sampleMappings[0] },
      { ...sampleMappings[0], id: 3, triggerText: 'world' },
    ];
    vi.mocked(mockReactionService.getMatchingMappings).mockReturnValue(duplicateMappings);

    await messageCallback({
      message: {
        subtype: undefined,
        text: 'hello world',
        channel: 'C123',
        channel_type: 'channel',
        ts: '123.456',
        type: 'message',
      },
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockClient.reactions.add).toHaveBeenCalledTimes(1);
  });

  it('リアクション追加失敗時はwarnログを出力して続行する', async () => {
    vi.mocked(mockReactionService.getMatchingMappings).mockReturnValue(sampleMappings);
    mockClient.reactions.add
      .mockRejectedValueOnce(new Error('already_reacted'))
      .mockResolvedValueOnce({ ok: true });

    await messageCallback({
      message: {
        subtype: undefined,
        text: 'hello',
        channel: 'C123',
        channel_type: 'channel',
        ts: '123.456',
        type: 'message',
      },
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockLogger.warn).toHaveBeenCalled();
    // 2番目のリアクションは成功する
    expect(mockClient.reactions.add).toHaveBeenCalledTimes(2);
  });

  it('マッチするリアクションがない場合は何もしない', async () => {
    vi.mocked(mockReactionService.getMatchingMappings).mockReturnValue([]);

    await messageCallback({
      message: {
        subtype: undefined,
        text: 'no match',
        channel: 'C123',
        channel_type: 'channel',
        ts: '123.456',
        type: 'message',
      },
      client: mockClient,
      logger: mockLogger,
      say: mockSay,
    });

    expect(mockClient.reactions.add).not.toHaveBeenCalled();
  });
});
