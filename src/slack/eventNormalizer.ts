import type { AppMentionEvent } from '@slack/types';
import type { SlackEvent } from '../commands/types';

export type ChannelType = 'channel' | 'im' | 'mpim' | 'group';

export function inferChannelType(channelId: string): ChannelType {
  switch (channelId.charAt(0)) {
    case 'C':
      return 'channel';
    case 'D':
      return 'im';
    case 'G':
      return 'group';
    default:
      return 'channel';
  }
}

export function normalizeAppMentionEvent(event: AppMentionEvent): SlackEvent {
  return {
    type: 'message',
    subtype: undefined,
    user: event.user ?? '',
    channel: event.channel,
    channel_type: inferChannelType(event.channel),
    event_ts: event.event_ts,
    ts: event.ts,
    text: event.text,
    thread_ts: event.thread_ts,
  };
}
