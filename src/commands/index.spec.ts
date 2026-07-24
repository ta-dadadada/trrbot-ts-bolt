import { describe, expect, it } from 'vitest';
import { DefaultCommand } from './defaultCommand';
import { DiceCommand } from './diceCommand';
import { GroupChoiceCommand } from './groupChoiceCommand';
import { GroupShuffleCommand } from './groupShuffleCommand';
import { resolveCommand } from './index';

describe('resolveCommand', () => {
  it('正式名を大文字小文字に依存せず解決する', () => {
    expect(resolveCommand('groupchoice').command).toBeInstanceOf(GroupChoiceCommand);
    expect(resolveCommand('GROUPSHUFFLE').command).toBeInstanceOf(GroupShuffleCommand);
  });

  it('エイリアスを同じ登録情報へ解決する', () => {
    const byPrimaryName = resolveCommand('groupchoice');
    const byAlias = resolveCommand('gc');

    expect(byAlias.command).toBe(byPrimaryName.command);
    expect(byAlias.registration).toBe(byPrimaryName.registration);
  });

  it('ダイス記法をDiceCommandへ解決し呼び出し名を保持する', () => {
    const resolution = resolveCommand('2D6');

    expect(resolution.command).toBeInstanceOf(DiceCommand);
    expect(resolution.registration?.primaryName).toBe('dice');
    expect(resolution.invokedName).toBe('2d6');
  });

  it('未知のコマンドをDefaultCommandへ解決する', () => {
    const resolution = resolveCommand('unknown');

    expect(resolution.command).toBeInstanceOf(DefaultCommand);
    expect(resolution.registration).toBeUndefined();
  });

  it('DM専用情報をコマンドと同時に返す', () => {
    const resolution = resolveCommand('secret');

    expect(resolution.registration?.dmOnly).toBe(true);
  });
});
