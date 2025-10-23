import { describe, it, expect, expectTypeOf } from 'vitest';
import type { SlackEvent, SayFunction, CommandContext } from './types';
import type { GenericMessageEvent } from '@slack/types';
import type { ChatPostMessageResponse } from '@slack/web-api';

describe('Type definitions', () => {
  describe('SlackEvent', () => {
    it('should be compatible with GenericMessageEvent', () => {
      const event: SlackEvent = {
        type: 'message',
        user: 'U123456',
        channel: 'C123456',
        channel_type: 'channel',
        event_ts: '1234567890.123456',
        ts: '1234567890.123456',
        text: 'test message',
      };

      expect(event.channel).toBe('C123456');
      expect(event.text).toBe('test message');
      expect(event.ts).toBe('1234567890.123456');
    });

    it('should allow optional properties', () => {
      const event: SlackEvent = {
        type: 'message',
        user: 'U123456',
        channel: 'C123456',
        channel_type: 'channel',
        event_ts: '1234567890.123456',
        ts: '1234567890.123456',
        text: 'test message',
        thread_ts: '1234567890.000000',
      };

      expect(event.thread_ts).toBe('1234567890.000000');
    });

    it('should be assignable to GenericMessageEvent', () => {
      expectTypeOf<SlackEvent>().toMatchTypeOf<GenericMessageEvent>();
    });
  });

  describe('SayFunction', () => {
    it('should accept string messages', () => {
      expectTypeOf<SayFunction>().parameter(0).toMatchTypeOf<string>();
    });

    it('should accept message objects', () => {
      expectTypeOf<SayFunction>().parameter(0).toMatchTypeOf<{ text: string }>();
    });

    it('should accept message objects with optional properties', () => {
      expectTypeOf<SayFunction>().parameter(0).toMatchTypeOf<{
        text: string;
        thread_ts?: string;
        blocks?: unknown[];
        attachments?: unknown[];
      }>();
    });

    it('should return ChatPostMessageResponse', () => {
      expectTypeOf<SayFunction>().returns.resolves.toMatchTypeOf<ChatPostMessageResponse>();
    });
  });

  describe('CommandContext', () => {
    it('should have correct properties', () => {
      expectTypeOf<CommandContext>().toHaveProperty('event');
      expectTypeOf<CommandContext>().toHaveProperty('say');
      expectTypeOf<CommandContext>().toHaveProperty('logger');
      expectTypeOf<CommandContext>().toHaveProperty('args');
      expectTypeOf<CommandContext>().toHaveProperty('client');
    });

    it('should have SlackEvent as event type', () => {
      expectTypeOf<CommandContext>().toMatchTypeOf<{ event: SlackEvent }>();
    });

    it('should have SayFunction as say type', () => {
      expectTypeOf<CommandContext>().toMatchTypeOf<{ say: SayFunction }>();
    });
  });
});
