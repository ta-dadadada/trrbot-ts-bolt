import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupOperations } from '../services/groupService';
import type { ReactionOperations } from '../services/reactionService';
import { GroupCommand } from './groupCommand';
import { ReactionCommand } from './reactionCommand';
import { SecretCommand } from './secretCommand';
import type { CommandContext, SayFunction, SlackEvent } from './types';

const groupService = {
  getAllGroups: vi.fn(),
  createGroup: vi.fn(),
  deleteGroup: vi.fn(),
  getItemsByGroupName: vi.fn(),
  getRandomItemFromGroup: vi.fn(),
  getRandomItemFromGroupExcluding: vi.fn(),
  addItemToGroup: vi.fn(),
  addItemsToGroup: vi.fn(),
  removeItemFromGroup: vi.fn(),
  clearGroupItems: vi.fn(),
} satisfies GroupOperations;

const reactionService = {
  findMatchingMappings: vi.fn(),
  addReactionMapping: vi.fn(),
  removeReactionMapping: vi.fn(),
  getAllReactionMappings: vi.fn(),
  incrementReactionUsage: vi.fn(),
} satisfies ReactionOperations;

function createContext(args: string[], invokedName: string): CommandContext {
  return {
    event: {
      type: 'message',
      user: 'U123',
      channel: 'C123',
      channel_type: 'channel',
      event_ts: '100.000',
      ts: '100.000',
      text: `${invokedName} ${args.join(' ')}`,
    } as SlackEvent,
    say: vi.fn().mockResolvedValue({ ok: true }) as SayFunction,
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      setName: vi.fn(),
      setLevel: vi.fn(),
      getLevel: vi.fn(),
    } as unknown as Logger,
    args,
    invokedName,
    client: {} as WebClient,
  };
}

describe('コマンドのエラー伝播', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('group addのDB失敗を既存文言とスレッド方針付きで伝播する', async () => {
    groupService.addItemToGroup.mockImplementation(() => {
      throw new Error('db down');
    });

    await expect(
      new GroupCommand(groupService).execute(createContext(['add', 'foods', 'ramen'], 'group')),
    ).rejects.toMatchObject({
      userMessage: 'アイテムの追加に失敗しました: db down',
      replyMode: 'message-thread',
    });
  });

  it('reaction addの入力エラーを既存文言とスレッド方針付きで伝播する', async () => {
    await expect(
      new ReactionCommand(reactionService).execute(
        createContext(['add', '', ':wave:'], 'reaction'),
      ),
    ).rejects.toMatchObject({
      userMessage: 'バリデーションエラー: Empty trigger text',
      replyMode: 'message-thread',
    });

    expect(reactionService.addReactionMapping).not.toHaveBeenCalled();
  });

  it('secretの入力エラーを共通ValidationErrorとして伝播する', async () => {
    await expect(
      new SecretCommand().execute(createContext(['invalid'], 'secret')),
    ).rejects.toMatchObject({
      userMessage: '有効な正の整数を指定してください。',
      replyMode: 'inherit',
    });
  });
});
