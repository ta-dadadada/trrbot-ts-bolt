import type { GroupOperations } from '../services/groupService';
import type { ReactionOperations } from '../services/reactionService';
import { ChoiceCommand } from './choiceCommand';
import { DefaultCommand } from './defaultCommand';
import { DiceCommand } from './diceCommand';
import { GroupChoiceCommand } from './groupChoiceCommand';
import { GroupCommand } from './groupCommand';
import { GroupShuffleCommand } from './groupShuffleCommand';
import { HelpCommand } from './helpCommand';
import { ReactionCommand } from './reactionCommand';
import { SecretCommand } from './secretCommand';
import { ShuffleCommand } from './shuffleCommand';
import type { Command } from './types';
import { ZakoSecretCommand } from './zakoSecretCommand';

export interface CommandRegistration {
  command: Command;
  primaryName: string;
  aliases: string[];
  displayName?: string;
  dmOnly?: boolean;
  helpExampleIndexes?: readonly number[];
}

export interface CommandResolution {
  command: Command;
  registration?: CommandRegistration;
  invokedName: string;
}

export interface CommandDependencies {
  groupService: GroupOperations;
  reactionService: ReactionOperations;
}

export interface CommandRegistry {
  commandRegistrations: readonly CommandRegistration[];
  resolveCommand(commandName: string): CommandResolution;
}

function normalizeCommandName(name: string): string {
  return name.toLowerCase();
}

function buildRegistrationMap(
  commandRegistrations: readonly CommandRegistration[],
): Map<string, CommandRegistration> {
  const map = new Map<string, CommandRegistration>();

  for (const registration of commandRegistrations) {
    for (const name of [registration.primaryName, ...registration.aliases]) {
      const normalizedName = normalizeCommandName(name);
      if (map.has(normalizedName)) {
        throw new Error(`Duplicate command name: ${normalizedName}`);
      }
      map.set(normalizedName, registration);
    }
  }

  return map;
}

function isDiceCode(text: string): boolean {
  return /^\d+d\d+$/i.test(text);
}

/**
 * 依存関係を注入したコマンド登録情報と解決関数を作成する。
 */
export function createCommandRegistry(dependencies: CommandDependencies): CommandRegistry {
  let registrations: readonly CommandRegistration[] = [];
  const helpCommand = new HelpCommand(() => registrations);

  registrations = Object.freeze([
    {
      command: helpCommand,
      primaryName: 'help',
      aliases: [],
    },
    {
      command: new ChoiceCommand(),
      primaryName: 'choice',
      aliases: [],
    },
    {
      command: new GroupChoiceCommand(dependencies.groupService),
      primaryName: 'groupChoice',
      aliases: ['gc', 'group-choice', 'gchoice'],
      displayName: 'gc',
    },
    {
      command: new ReactionCommand(dependencies.reactionService),
      primaryName: 'reaction',
      aliases: [],
    },
    {
      command: new GroupCommand(dependencies.groupService),
      primaryName: 'group',
      aliases: [],
    },
    {
      command: new DiceCommand(),
      primaryName: 'dice',
      aliases: [],
      helpExampleIndexes: [0, 2],
    },
    {
      command: new ZakoSecretCommand(),
      primaryName: 'zako-secret',
      aliases: [],
      dmOnly: true,
    },
    {
      command: new SecretCommand(),
      primaryName: 'secret',
      aliases: [],
      dmOnly: true,
    },
    {
      command: new ShuffleCommand(),
      primaryName: 'shuffle',
      aliases: [],
    },
    {
      command: new GroupShuffleCommand(dependencies.groupService),
      primaryName: 'groupShuffle',
      aliases: ['gs', 'group-shuffle', 'gshuffle'],
      displayName: 'gs',
    },
  ] satisfies CommandRegistration[]);

  const registrationMap = buildRegistrationMap(registrations);
  const diceRegistration = registrationMap.get('dice');
  const defaultCommand = new DefaultCommand();

  return {
    commandRegistrations: registrations,
    resolveCommand(commandName: string): CommandResolution {
      const invokedName = normalizeCommandName(commandName);

      if (isDiceCode(invokedName) && diceRegistration) {
        return {
          command: diceRegistration.command,
          registration: diceRegistration,
          invokedName,
        };
      }

      const registration = registrationMap.get(invokedName);
      return {
        command: registration?.command ?? defaultCommand,
        registration,
        invokedName,
      };
    },
  };
}
