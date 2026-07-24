import type { AppMentionEvent } from '@slack/types';
import { describe, expect, it } from 'vitest';
import { inferChannelType, normalizeAppMentionEvent } from './eventNormalizer';

describe('inferChannelType', () => {
  it.each([
    ['C123', 'channel'],
    ['D123', 'im'],
    ['G123', 'group'],
    ['X123', 'channel'],
  ] as const)('%sを%sへ変換する', (channelId, expected) => {
    expect(inferChannelType(channelId)).toBe(expected);
  });
});

describe('normalizeAppMentionEvent', () => {
  it('raw textとイベント識別子を維持してSlackEventへ変換する', () => {
    const event = {
      type: 'app_mention',
      user: 'U123',
      channel: 'C123',
      event_ts: '100.000',
      ts: '100.000',
      text: '<@UBOT> 2d6',
      thread_ts: '99.000',
    } as AppMentionEvent;

    expect(normalizeAppMentionEvent(event)).toEqual({
      type: 'message',
      subtype: undefined,
      user: 'U123',
      channel: 'C123',
      channel_type: 'channel',
      event_ts: '100.000',
      ts: '100.000',
      text: '<@UBOT> 2d6',
      thread_ts: '99.000',
    });
  });
});
