import { describe, it, expect, beforeEach, vi } from 'vitest';

// commands/index.ts uses module-level state, so we need to mock the container
// before importing. We use dynamic imports after mocking.
vi.mock('../container', () => ({
  resolveGroupService: vi.fn().mockReturnValue({
    getAllGroups: vi.fn(),
    getGroupByName: vi.fn(),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
    getItemsByGroupName: vi.fn(),
    getRandomItemFromGroup: vi.fn(),
    getRandomItemFromGroupExcluding: vi.fn(),
    addItemToGroup: vi.fn(),
    addItemsToGroup: vi.fn(),
    removeItemFromGroup: vi.fn(),
    clearGroupItems: vi.fn(),
  }),
  resolveReactionService: vi.fn().mockReturnValue({
    getAllReactionMappings: vi.fn(),
    getMatchingMappings: vi.fn(),
    addReactionMapping: vi.fn(),
    removeReactionMapping: vi.fn(),
    incrementReactionUsage: vi.fn(),
  }),
}));

import {
  initializeCommands,
  getCommand,
  getCommandRegistration,
  getCommandRegistrations,
  getAllCommands,
  getDefaultCommand,
} from './index';
import { DiceCommand } from './diceCommand';
import { DefaultCommand } from './defaultCommand';
import { HelpCommand } from './helpCommand';

describe('commands/index', () => {
  beforeEach(() => {
    // Reset module state for each test by re-initializing
    // Note: initializeCommands has an early return if already initialized,
    // so we test with that behavior in mind.
    initializeCommands();
  });

  describe('initializeCommands', () => {
    it('二重初期化しても例外を投げない', () => {
      expect(() => initializeCommands()).not.toThrow();
    });
  });

  describe('getCommand', () => {
    it('登録済みコマンド名でコマンドを取得できる', () => {
      const command = getCommand('help');
      expect(command).toBeInstanceOf(HelpCommand);
    });

    it('大文字小文字を区別しない', () => {
      const command = getCommand('HELP');
      expect(command).toBeInstanceOf(HelpCommand);
    });

    it('未知のコマンド名ではデフォルトコマンドを返す', () => {
      const command = getCommand('unknownCommand');
      expect(command).toBeInstanceOf(DefaultCommand);
    });

    it('ダイスコード形式ならDiceCommandを返す', () => {
      expect(getCommand('2d6')).toBeInstanceOf(DiceCommand);
      expect(getCommand('1d20')).toBeInstanceOf(DiceCommand);
      expect(getCommand('10D100')).toBeInstanceOf(DiceCommand);
    });

    it('エイリアスでコマンドを取得できる', () => {
      const gc = getCommand('gc');
      const groupChoice = getCommand('group-choice');
      // 同じインスタンスを返す（gcもgroup-choiceもGroupChoiceCommandのエイリアス）
      expect(gc).toBe(groupChoice);
    });
  });

  describe('getCommandRegistration', () => {
    it('プライマリ名で登録情報を取得できる', () => {
      const reg = getCommandRegistration('help');
      expect(reg).toBeDefined();
      expect(reg!.primaryName).toBe('help');
    });

    it('エイリアスで登録情報を取得できる', () => {
      const reg = getCommandRegistration('gc');
      expect(reg).toBeDefined();
      expect(reg!.primaryName).toBe('groupChoice');
    });

    it('DM専用コマンドにはdmOnlyフラグがある', () => {
      const reg = getCommandRegistration('secret');
      expect(reg).toBeDefined();
      expect(reg!.dmOnly).toBe(true);
    });

    it('存在しないコマンドはundefined', () => {
      expect(getCommandRegistration('nonexistent')).toBeUndefined();
    });
  });

  describe('getCommandRegistrations', () => {
    it('すべての登録情報を返す', () => {
      const regs = getCommandRegistrations();
      expect(regs.length).toBeGreaterThan(0);
      const names = regs.map((r) => r.primaryName);
      expect(names).toContain('help');
      expect(names).toContain('dice');
      expect(names).toContain('choice');
    });
  });

  describe('getAllCommands', () => {
    it('コマンドの配列を返す', () => {
      const commands = getAllCommands();
      expect(commands.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultCommand', () => {
    it('DefaultCommandを返す', () => {
      expect(getDefaultCommand()).toBeInstanceOf(DefaultCommand);
    });
  });
});
