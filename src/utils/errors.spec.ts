import { describe, it, expect } from 'vitest';
import { BotError, ValidationError, DatabaseError, SlackAPIError } from './errors';

describe('Error classes', () => {
  describe('BotError', () => {
    it('should create error with all properties', () => {
      const context = { userId: 'U123', value: 'test' };
      const error = new BotError('Internal message', 'User message', context, true, 'error');

      expect(error.message).toBe('Internal message');
      expect(error.userMessage).toBe('User message');
      expect(error.context).toEqual(context);
      expect(error.isRetryable).toBe(true);
      expect(error.severity).toBe('error');
      expect(error.name).toBe('BotError');
    });

    it('should have default values for optional parameters', () => {
      const error = new BotError('Internal message', 'User message');

      expect(error.context).toBeUndefined();
      expect(error.isRetryable).toBe(false);
      expect(error.severity).toBe('error');
    });

    it('should capture stack trace', () => {
      const error = new BotError('Test', 'Test user message');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('BotError');
    });

    it('should be instance of Error', () => {
      const error = new BotError('Test', 'Test user message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BotError);
    });
  });

  describe('ValidationError', () => {
    it('should be non-retryable and warn level', () => {
      const error = new ValidationError('Invalid input', 'Invalid input provided', {
        value: 'abc',
      });

      expect(error.isRetryable).toBe(false);
      expect(error.severity).toBe('warn');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(BotError);
    });

    it('should have correct messages', () => {
      const context = { providedValue: 'invalid' };
      const error = new ValidationError(
        'Internal: Invalid dice notation',
        'ダイス記法が不正です',
        context,
      );

      expect(error.message).toBe('Internal: Invalid dice notation');
      expect(error.userMessage).toBe('ダイス記法が不正です');
      expect(error.context).toEqual(context);
    });
  });

  describe('DatabaseError', () => {
    it('should be retryable and error level', () => {
      const error = new DatabaseError('Database connection failed');

      expect(error.isRetryable).toBe(true);
      expect(error.severity).toBe('error');
      expect(error.name).toBe('DatabaseError');
      expect(error).toBeInstanceOf(BotError);
    });

    it('should have default user message', () => {
      const error = new DatabaseError('DB failed');

      expect(error.userMessage).toContain('データベース操作中');
      expect(error.userMessage).toContain('再試行');
    });

    it('should accept context', () => {
      const context = { operation: 'insert', table: 'users' };
      const error = new DatabaseError('Insert failed', context);

      expect(error.context).toEqual(context);
      expect(error.message).toBe('Insert failed');
    });
  });

  describe('SlackAPIError', () => {
    it('should be retryable and error level', () => {
      const error = new SlackAPIError('API timeout');

      expect(error.isRetryable).toBe(true);
      expect(error.severity).toBe('error');
      expect(error.name).toBe('SlackAPIError');
      expect(error).toBeInstanceOf(BotError);
    });

    it('should have default user message', () => {
      const error = new SlackAPIError('Rate limit exceeded');

      expect(error.userMessage).toContain('Slack API');
      expect(error.userMessage).toContain('再試行');
    });

    it('should accept context', () => {
      const context = { endpoint: '/chat.postMessage', statusCode: 429 };
      const error = new SlackAPIError('Rate limited', context);

      expect(error.context).toEqual(context);
      expect(error.message).toBe('Rate limited');
    });
  });

  describe('Error hierarchy', () => {
    it('all custom errors should extend BotError', () => {
      const validationError = new ValidationError('Test', 'Test');
      const databaseError = new DatabaseError('Test');
      const slackApiError = new SlackAPIError('Test');

      expect(validationError).toBeInstanceOf(BotError);
      expect(databaseError).toBeInstanceOf(BotError);
      expect(slackApiError).toBeInstanceOf(BotError);
    });

    it('all custom errors should extend Error', () => {
      const validationError = new ValidationError('Test', 'Test');
      const databaseError = new DatabaseError('Test');
      const slackApiError = new SlackAPIError('Test');

      expect(validationError).toBeInstanceOf(Error);
      expect(databaseError).toBeInstanceOf(Error);
      expect(slackApiError).toBeInstanceOf(Error);
    });
  });
});
