import { describe, it, expect } from 'vitest';
import { getReplyOptions } from './reply';
import { SlackEvent } from '../types';

describe('getReplyOptions', () => {
  const createMockEvent = (overrides: Partial<SlackEvent> = {}): SlackEvent =>
    ({
      type: 'message',
      user: 'U123456',
      channel: 'C123456',
      channel_type: 'channel',
      event_ts: '1234567890.123456',
      ts: '1234567890.123456',
      text: 'test message',
      ...overrides,
    }) as SlackEvent;

  it('スレッド内のイベントの場合、thread_ts を返すこと', () => {
    const event = createMockEvent({
      thread_ts: '1234567890.111111',
      ts: '1234567890.222222',
    });

    const result = getReplyOptions(event);

    expect(result).toEqual({
      thread_ts: '1234567890.111111',
    });
  });

  it('通常のメッセージの場合、event.ts を返すこと', () => {
    const event = createMockEvent({
      thread_ts: undefined,
      ts: '1234567890.333333',
    });

    const result = getReplyOptions(event);

    expect(result).toEqual({
      thread_ts: '1234567890.333333',
    });
  });
});
