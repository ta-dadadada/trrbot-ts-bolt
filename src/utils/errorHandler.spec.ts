import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCommandError, logCommandSuccess, logDebug } from './errorHandler';
import { ValidationError, DatabaseError } from './errors';
import type { CommandContext } from '../commands/types';
import type { Logger } from '@slack/logger';

describe('errorHandler', () => {
  let mockLogger: Logger;
  let mockSay: ReturnType<typeof vi.fn>;
  let mockContext: CommandContext;

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      setName: vi.fn(),
      setLevel: vi.fn(),
      getLevel: vi.fn(),
    } as unknown as Logger;

    mockSay = vi.fn();

    mockContext = {
      event: {
        text: 'dice invalid',
        ts: '1234567890.123456',
        user: 'U123456',
        channel: 'C789012',
        channel_type: 'channel',
      },
      say: mockSay,
      logger: mockLogger,
      args: ['invalid'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client: {} as any,
    };
  });

  describe('handleCommandError', () => {
    it('should handle ValidationError with warn level', async () => {
      const error = new ValidationError('Invalid input', 'ユーザー向けエラーメッセージ', {
        value: 'invalid',
      });

      await handleCommandError(error, mockContext, 'dice');

      // ロガー名の設定を確認
      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:dice');

      // 警告レベルでログ出力されることを確認（Pinoはオブジェクトを直接渡す）
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnArgs = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = warnArgs[0]; // Pinoはオブジェクトなのでそのまま
      expect(logEntry.message).toBe('Invalid input');
      expect(logEntry.command).toBe('dice');
      expect(logEntry.errorName).toBe('ValidationError');
      expect(logEntry.isRetryable).toBe(false);
      expect(logEntry.value).toBe('invalid');

      // ユーザーへの通知を確認
      expect(mockSay).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'ユーザー向けエラーメッセージ',
        }),
      );
    });

    it('should handle DatabaseError with error level', async () => {
      const error = new DatabaseError('Database connection failed', { operation: 'insert' });

      await handleCommandError(error, mockContext, 'group');

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:group');
      expect(mockLogger.error).toHaveBeenCalled();

      const errorArgs = (mockLogger.error as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = errorArgs[0];
      expect(logEntry.message).toBe('Database connection failed');
      expect(logEntry.errorName).toBe('DatabaseError');
      expect(logEntry.isRetryable).toBe(true);
    });

    it('should handle standard Error', async () => {
      const error = new Error('Unexpected error');

      await handleCommandError(error, mockContext, 'dice');

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:dice');
      expect(mockLogger.error).toHaveBeenCalled();

      const errorArgs = (mockLogger.error as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = errorArgs[0];
      expect(logEntry.message).toBe('Unexpected error');
      expect(logEntry.errorName).toBe('Error');
      expect(logEntry.stack).toBeDefined();
    });

    it('should handle unknown error types', async () => {
      const error = 'String error';

      await handleCommandError(error, mockContext, 'dice');

      expect(mockLogger.error).toHaveBeenCalled();
      const errorArgs = (mockLogger.error as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = errorArgs[0];
      expect(logEntry.message).toBe('String error');

      expect(mockSay).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'エラーが発生しました。',
        }),
      );
    });

    it('should include context information in logs', async () => {
      const error = new ValidationError('Test error', 'Test message', { customField: 'value' });

      await handleCommandError(error, mockContext, 'test');

      const warnArgs = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = warnArgs[0];

      expect(logEntry.command).toBe('test');
      expect(logEntry.user).toBe('U123456');
      expect(logEntry.channel).toBe('C789012');
      expect(logEntry.channelType).toBe('channel');
      expect(logEntry.timestamp).toBe('1234567890.123456');
      expect(logEntry.errorName).toBe('ValidationError');
      expect(logEntry.isRetryable).toBe(false);
      expect(logEntry.customField).toBe('value');
    });

    it('should handle say failure gracefully', async () => {
      mockSay.mockRejectedValue(new Error('Say failed'));
      const error = new ValidationError('Test', 'Test message');

      await handleCommandError(error, mockContext, 'dice');

      // ValidationErrorはwarnレベルなので、errorは1回だけ（say失敗時）
      expect(mockLogger.warn).toHaveBeenCalledTimes(1); // 元のエラーはwarn
      expect(mockLogger.error).toHaveBeenCalledTimes(1); // say失敗
      const errorCall = (mockLogger.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(errorCall[0]).toBe('Failed to send error message to user');
    });

    it('should respond in thread if event is in thread', async () => {
      mockContext.event.thread_ts = '1234567890.000000';
      const error = new ValidationError('Test', 'Test message');

      await handleCommandError(error, mockContext, 'dice');

      expect(mockSay).toHaveBeenCalledWith(
        expect.objectContaining({
          thread_ts: '1234567890.000000',
        }),
      );
    });

    it('should work without command name', async () => {
      const error = new ValidationError('Test', 'Test message');

      await handleCommandError(error, mockContext);

      expect(mockLogger.setName).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('logCommandSuccess', () => {
    it('should log success with info level', () => {
      logCommandSuccess(mockLogger, 'dice', {
        user: 'U123',
        result: 4,
      });

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:dice');
      expect(mockLogger.info).toHaveBeenCalled();

      const infoArgs = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = infoArgs[0];
      expect(logEntry.message).toBe('Command executed successfully');
      expect(logEntry.user).toBe('U123');
      expect(logEntry.result).toBe(4);
    });

    it('should include context in log', () => {
      logCommandSuccess(mockLogger, 'group', {
        user: 'U123',
        groupName: 'test-group',
        operation: 'create',
      });

      const infoArgs = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = infoArgs[0];

      expect(logEntry.message).toBe('Command executed successfully');
      expect(logEntry.user).toBe('U123');
      expect(logEntry.groupName).toBe('test-group');
      expect(logEntry.operation).toBe('create');
    });
  });

  describe('logDebug', () => {
    it('should log debug message with command name', () => {
      logDebug(mockLogger, 'dice', 'Parsing dice command', { args: ['2d6'] });

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:dice');
      expect(mockLogger.debug).toHaveBeenCalled();

      const debugArgs = (mockLogger.debug as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = debugArgs[0];
      expect(logEntry.message).toBe('Parsing dice command');
      expect(logEntry.args).toEqual(['2d6']);
    });

    it('should work without data parameter', () => {
      logDebug(mockLogger, 'help', 'Showing help text');

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:help');
      expect(mockLogger.debug).toHaveBeenCalled();

      const debugArgs = (mockLogger.debug as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = debugArgs[0];
      expect(logEntry.message).toBe('Showing help text');
    });
  });

  describe('Pino JSON output format', () => {
    it('should output objects directly for Pino to convert to JSON', async () => {
      const error = new ValidationError('Test error', 'Test message', { customField: 'value' });
      await handleCommandError(error, mockContext, 'test');

      const warnArgs = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = warnArgs[0];

      // Pinoはオブジェクトを受け取り、内部でJSONに変換
      expect(typeof logEntry).toBe('object');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry).toHaveProperty('customField');
      expect(logEntry.customField).toBe('value');
    });

    it('should maintain structured log format for debugging', () => {
      logDebug(mockLogger, 'test', 'Debug message', { key: 'value', nested: { a: 1 } });

      const debugArgs = (mockLogger.debug as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = debugArgs[0];

      expect(typeof logEntry).toBe('object');
      expect(logEntry.message).toBe('Debug message');
      expect(logEntry.key).toBe('value');
      expect(logEntry.nested).toEqual({ a: 1 });
    });

    it('should pass objects that Pino will serialize to JSON', () => {
      logCommandSuccess(mockLogger, 'test', { user: 'U123', action: 'completed' });

      const infoArgs = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      const logEntry = infoArgs[0];

      // Pinoに渡されるのはオブジェクト（Pinoが内部でJSON.stringifyする）
      expect(typeof logEntry).toBe('object');
      expect(logEntry.message).toBe('Command executed successfully');
      expect(logEntry.user).toBe('U123');
      expect(logEntry.action).toBe('completed');
    });
  });
});
