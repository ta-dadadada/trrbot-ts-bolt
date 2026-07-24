import { describe, expect, it, vi } from 'vitest';
import type { GroupOperations } from '../services/groupService';
import type { ReactionOperations } from '../services/reactionService';
import { DefaultCommand } from './defaultCommand';
import { DiceCommand } from './diceCommand';
import { GroupChoiceCommand } from './groupChoiceCommand';
import { GroupShuffleCommand } from './groupShuffleCommand';
import { createCommandRegistry } from './index';

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

const registry = createCommandRegistry({ groupService, reactionService });

describe('createCommandRegistry', () => {
  it('正式名を大文字小文字に依存せず解決する', () => {
    expect(registry.resolveCommand('groupchoice').command).toBeInstanceOf(GroupChoiceCommand);
    expect(registry.resolveCommand('GROUPSHUFFLE').command).toBeInstanceOf(GroupShuffleCommand);
  });

  it('エイリアスを同じ登録情報へ解決する', () => {
    const byPrimaryName = registry.resolveCommand('groupchoice');
    const byAlias = registry.resolveCommand('gc');

    expect(byAlias.command).toBe(byPrimaryName.command);
    expect(byAlias.registration).toBe(byPrimaryName.registration);
  });

  it('ダイス記法をDiceCommandへ解決し呼び出し名を保持する', () => {
    const resolution = registry.resolveCommand('2D6');

    expect(resolution.command).toBeInstanceOf(DiceCommand);
    expect(resolution.registration?.primaryName).toBe('dice');
    expect(resolution.invokedName).toBe('2d6');
  });

  it('未知のコマンドをDefaultCommandへ解決する', () => {
    const resolution = registry.resolveCommand('unknown');

    expect(resolution.command).toBeInstanceOf(DefaultCommand);
    expect(resolution.registration).toBeUndefined();
  });

  it('DM専用情報をコマンドと同時に返す', () => {
    expect(registry.resolveCommand('secret').registration?.dmOnly).toBe(true);
  });

  it('登録一覧を読み取り専用として公開する', () => {
    expect(Object.isFrozen(registry.commandRegistrations)).toBe(true);
    expect(registry.commandRegistrations.map((registration) => registration.primaryName)).toEqual([
      'help',
      'choice',
      'groupChoice',
      'reaction',
      'group',
      'dice',
      'zako-secret',
      'secret',
      'shuffle',
      'groupShuffle',
    ]);
  });
});
