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
 * コマンド名をキーとしたコマンドマップ
 */
const commandMap: Record<string, Command> = {
  [helpCommand.name]: helpCommand,
  [choiceCommand.name]: choiceCommand,
  [groupChoiceCommand.name]: groupChoiceCommand,
  [reactionCommand.name]: reactionCommand,
  [groupCommand.name]: groupCommand,
  [diceCommand.name]: diceCommand,
  [zakoSecretCommand.name]: zakoSecretCommand,
  [secretCommand.name]: secretCommand,
  [shuffleCommand.name]: shuffleCommand,
  [groupShuffleCommand.name]: groupShuffleCommand,
};

// helpCommandにコマンド一覧を設定
helpCommand.setCommands(Object.values(commandMap));

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