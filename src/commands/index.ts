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

const registrations: CommandRegistration[] = [];
const helpCommand = new HelpCommand(() => registrations);
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

registrations.push(
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
    helpExampleIndexes: [0, 2],
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
);

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

const commandRegistrations: readonly CommandRegistration[] = Object.freeze(registrations);
const registrationMap = buildRegistrationMap(commandRegistrations);
const diceRegistration = registrationMap.get('dice');

function isDiceCode(text: string): boolean {
  return /^\d+d\d+$/i.test(text);
}

export function resolveCommand(commandName: string): CommandResolution {
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
}

export { commandRegistrations };
