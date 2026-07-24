import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import type { GenericMessageEvent } from '@slack/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as randomUtils from '../utils/random';
import { SecretCommand } from './secretCommand';
import type { CommandContext, SayFunction } from './types';

const createContext = (args: string[], event: GenericMessageEvent): CommandContext => ({
  event,
  say: vi.fn().mockResolvedValue({ ok: true }) as SayFunction,
  logger: {} as Logger,
  args,
  invokedName: 'secret',
  client: {} as WebClient,
});

const createEvent = (threadTs?: string): GenericMessageEvent => ({
  type: 'message',
  subtype: undefined,
  user: 'U123',
  channel: 'C123',
  channel_type: 'channel',
  event_ts: '100.000',
  ts: '100.000',
  text: 'secret',
  ...(threadTs && { thread_ts: threadTs }),
});

describe('SecretCommand', () => {
  let command: SecretCommand;

  beforeEach(() => {
    command = new SecretCommand();
    vi.spyOn(randomUtils, 'getRandomStringWithSymbols').mockReturnValue('aB!2');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('引数なしでは既定の10文字を生成して通常メッセージに返信する', async () => {
    const context = createContext([], createEvent());

    await command.execute(context);

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(10);
    expect(context.say).toHaveBeenCalledWith({
      text: '🔐 生成されたシークレット文字列（記号含む）: `aB!2`',
    });
  });

  it('指定した長さを生成する', async () => {
    const context = createContext(['25'], createEvent());

    await command.execute(context);

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(25);
  });

  it('100を超える指定は100文字に制限する', async () => {
    const context = createContext(['101'], createEvent());

    await command.execute(context);

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(100);
  });

  it.each(['text', '0', '-1'])('不正な長さ %s はValidationErrorにする', async (value) => {
    const context = createContext([value], createEvent());

    await expect(command.execute(context)).rejects.toMatchObject({
      message: `Invalid secret length: ${value}`,
      userMessage: '有効な正の整数を指定してください。',
      context: { providedValue: value },
    });
    expect(randomUtils.getRandomStringWithSymbols).not.toHaveBeenCalled();
    expect(context.say).not.toHaveBeenCalled();
  });

  it('parseIntで解釈できる先頭の整数を長さとして使う', async () => {
    const context = createContext(['12abc'], createEvent());

    await command.execute(context);

    expect(randomUtils.getRandomStringWithSymbols).toHaveBeenCalledWith(12);
  });

  it('生成に失敗すると原因をcontextに含むBotErrorを送出する', async () => {
    vi.mocked(randomUtils.getRandomStringWithSymbols).mockImplementation(() => {
      throw new Error('random source unavailable');
    });
    const context = createContext([], createEvent());

    await expect(command.execute(context)).rejects.toMatchObject({
      name: 'BotError',
      message: 'Failed to generate secret string',
      userMessage: 'ランダム文字列の生成中にエラーが発生しました。',
      context: { error: 'random source unavailable' },
    });
    expect(context.say).not.toHaveBeenCalled();
  });

  it('既存スレッドではスレッドに返信する', async () => {
    const context = createContext([], createEvent('99.000'));

    await command.execute(context);

    expect(context.say).toHaveBeenCalledWith({
      text: '🔐 生成されたシークレット文字列（記号含む）: `aB!2`',
      thread_ts: '99.000',
    });
  });
});
