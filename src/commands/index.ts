import { Command } from './types';
import { HelpCommand } from './helpCommand';
import { ChoiceCommand } from './choiceCommand';
import { ReactionCommand } from './reaction';
import { GroupCommand, GroupChoiceCommand, GroupShuffleCommand } from './group';
import { DiceCommand } from './diceCommand';
import { ZakoSecretCommand } from './zakoSecretCommand';
import { SecretCommand } from './secretCommand';
import { ShuffleCommand } from './shuffleCommand';
import { DefaultCommand } from './defaultCommand';
import { resolveGroupService, resolveReactionService } from '../container';

/**
 * コマンド登録情報
 */
export interface CommandRegistration {
  command: Command;
  primaryName: string;
  aliases: string[];
  displayName?: string;
  dmOnly?: boolean; // DM専用コマンドかどうか
}

/**
 * コマンドインスタンス（遅延初期化）
 */
let commandsInitialized = false;
let helpCommand: HelpCommand;
let choiceCommand: ChoiceCommand;
let groupChoiceCommand: GroupChoiceCommand;
let reactionCommand: ReactionCommand;
let groupCommand: GroupCommand;
let diceCommand: DiceCommand;
let zakoSecretCommand: ZakoSecretCommand;
let secretCommand: SecretCommand;
let shuffleCommand: ShuffleCommand;
let groupShuffleCommand: GroupShuffleCommand;
let defaultCommand: DefaultCommand;
let registrations: CommandRegistration[];
let commandMap: Record<string, Command>;

/**
 * コマンドを初期化する
 * DIコンテナが初期化された後に呼び出す必要がある
 */
export function initializeCommands(): void {
  if (commandsInitialized) {
    return;
  }

  // サービスを解決
  const groupService = resolveGroupService();
  const reactionService = resolveReactionService();

  // コマンドインスタンスを作成
  helpCommand = new HelpCommand();
  choiceCommand = new ChoiceCommand();
  groupChoiceCommand = new GroupChoiceCommand(groupService);
  reactionCommand = new ReactionCommand(reactionService);
  groupCommand = new GroupCommand(groupService);
  diceCommand = new DiceCommand();
  zakoSecretCommand = new ZakoSecretCommand();
  secretCommand = new SecretCommand();
  shuffleCommand = new ShuffleCommand();
  groupShuffleCommand = new GroupShuffleCommand(groupService);
  defaultCommand = new DefaultCommand();

  // コマンド登録情報の配列
  registrations = [
    {
      command: helpCommand,
      primaryName: 'help',
      aliases: [],
    },
    {
      command: choiceCommand,
      primaryName: 'choice',
      aliases: [],
    },
    {
      command: groupChoiceCommand,
      primaryName: 'groupChoice',
      aliases: ['gc', 'group-choice', 'gchoice'],
      displayName: 'gc',
    },
    {
      command: reactionCommand,
      primaryName: 'reaction',
      aliases: [],
    },
    {
      command: groupCommand,
      primaryName: 'group',
      aliases: [],
    },
    {
      command: diceCommand,
      primaryName: 'dice',
      aliases: [],
    },
    {
      command: zakoSecretCommand,
      primaryName: 'zako-secret',
      aliases: [],
      dmOnly: true,
    },
    {
      command: secretCommand,
      primaryName: 'secret',
      aliases: [],
      dmOnly: true,
    },
    {
      command: shuffleCommand,
      primaryName: 'shuffle',
      aliases: [],
    },
    {
      command: groupShuffleCommand,
      primaryName: 'groupShuffle',
      aliases: ['gs', 'group-shuffle', 'gshuffle'],
      displayName: 'gs',
    },
  ];

  // コマンドマップを構築
  commandMap = buildCommandMap(registrations);

  // helpCommandにコマンド登録情報を設定
  helpCommand.setCommands(registrations);

  commandsInitialized = true;
}

function ensureInitialized(): void {
  if (!commandsInitialized) {
    throw new Error('Commands not initialized. Call initializeCommands() first.');
  }
}

/**
 * コマンドマップを構築する
 */
function buildCommandMap(regs: CommandRegistration[]): Record<string, Command> {
  const map: Record<string, Command> = {};

  for (const reg of regs) {
    map[reg.primaryName] = reg.command;
    for (const alias of reg.aliases) {
      map[alias] = reg.command;
    }
  }

  return map;
}

/**
 * コマンド名からコマンド登録情報を検索する
 */
export function getCommandRegistration(commandName: string): CommandRegistration | undefined {
  ensureInitialized();
  return registrations.find(
    (reg) => reg.primaryName === commandName || reg.aliases.includes(commandName),
  );
}

/**
 * コマンド登録情報の配列をエクスポート
 */
export function getCommandRegistrations(): CommandRegistration[] {
  ensureInitialized();
  return registrations;
}

/**
 * ダイスコード（例: 2d6）かどうかをチェックする
 */
const isDiceCode = (text: string): boolean => {
  return /^\d+d\d+$/i.test(text);
};

/**
 * コマンド名からコマンドを取得する
 */
export const getCommand = (commandName: string): Command => {
  ensureInitialized();

  const lowerCommandName = commandName.toLowerCase();

  // ダイスコード形式（例: 2d6）の場合はdiceCommandを返す
  if (isDiceCode(lowerCommandName)) {
    return diceCommand;
  }

  const command = commandMap[lowerCommandName];
  return command || defaultCommand;
};

/**
 * 利用可能なすべてのコマンドを取得する
 */
export const getAllCommands = (): Command[] => {
  ensureInitialized();
  return Object.values(commandMap);
};

/**
 * デフォルトコマンドを取得する
 */
export const getDefaultCommand = (): Command => {
  ensureInitialized();
  return defaultCommand;
};
