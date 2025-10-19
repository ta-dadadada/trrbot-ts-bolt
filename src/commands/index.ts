import { Command } from './types';
import { HelpCommand } from './helpCommand';
import { ChoiceCommand } from './choiceCommand';
import { GroupChoiceCommand } from './groupChoiceCommand';
import { ReactionCommand } from './reactionCommand';
import { GroupCommand } from './groupCommand';
import { DiceCommand } from './diceCommand';
import { ZakoSecretCommand } from './zakoSecretCommand';
import { SecretCommand } from './secretCommand';
import { ShuffleCommand } from './shuffleCommand';
import { GroupShuffleCommand } from './groupShuffleCommand';
import { DefaultCommand } from './defaultCommand';

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
 * 利用可能なすべてのコマンドのインスタンスを作成
 */
const helpCommand = new HelpCommand();
const choiceCommand = new ChoiceCommand();
const groupChoiceCommand = new GroupChoiceCommand();
const reactionCommand = new ReactionCommand();
const groupCommand = new GroupCommand();
const diceCommand = new DiceCommand();
const zakoSecretCommand = new ZakoSecretCommand();
const secretCommand = new SecretCommand();
const shuffleCommand = new ShuffleCommand();
const groupShuffleCommand = new GroupShuffleCommand();
const defaultCommand = new DefaultCommand();

/**
 * コマンド登録情報の配列
 */
const registrations: CommandRegistration[] = [
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

/**
 * コマンドマップを構築する
 * @param registrations コマンド登録情報の配列
 * @returns コマンド名をキーとしたコマンドマップ
 */
function buildCommandMap(registrations: CommandRegistration[]): Record<string, Command> {
  const map: Record<string, Command> = {};

  for (const reg of registrations) {
    // 正式名でも登録
    map[reg.primaryName] = reg.command;
    // エイリアスでも登録
    for (const alias of reg.aliases) {
      map[alias] = reg.command;
    }
  }

  return map;
}

/**
 * コマンド名からコマンド登録情報を検索する
 * @param commandName コマンド名
 * @returns コマンド登録情報（見つからない場合はundefined）
 */
export function getCommandRegistration(commandName: string): CommandRegistration | undefined {
  return registrations.find(
    (reg) => reg.primaryName === commandName || reg.aliases.includes(commandName),
  );
}

/**
 * コマンド名をキーとしたコマンドマップ
 */
const commandMap: Record<string, Command> = buildCommandMap(registrations);

// helpCommandにコマンド登録情報を設定
helpCommand.setCommands(registrations);

/**
 * コマンド登録情報の配列をエクスポート
 */
export { registrations as commandRegistrations };

/**
 * ダイスコード（例: 2d6）かどうかをチェックする
 * @param text チェックする文字列
 * @returns ダイスコードの場合はtrue、そうでない場合はfalse
 */
const isDiceCode = (text: string): boolean => {
  // nDm または ndm 形式（大文字小文字を区別しない）
  return /^\d+d\d+$/i.test(text);
};

/**
 * コマンド名からコマンドを取得する
 * @param commandName コマンド名
 * @returns コマンドインスタンス（存在しない場合はデフォルトコマンド）
 */
export const getCommand = (commandName: string): Command => {
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
 * @returns コマンドの配列
 */
export const getAllCommands = (): Command[] => {
  return Object.values(commandMap);
};

/**
 * デフォルトコマンドを取得する
 * @returns デフォルトコマンド
 */
export const getDefaultCommand = (): Command => {
  return defaultCommand;
};
