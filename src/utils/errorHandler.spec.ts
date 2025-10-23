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

      // 警告レベルでログ出力されることを確認
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnArgs = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(warnArgs[0]).toBe('Invalid input');
      expect(warnArgs).toContain('\nContext:');

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
      expect(errorArgs[0]).toBe('Database connection failed');
    });

    it('should handle standard Error', async () => {
      const error = new Error('Unexpected error');

      await handleCommandError(error, mockContext, 'dice');

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:dice');
      expect(mockLogger.error).toHaveBeenCalled();

      const errorArgs = (mockLogger.error as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(errorArgs[0]).toBe('Unexpected error');
    });

    it('should handle unknown error types', async () => {
      const error = 'String error';

      await handleCommandError(error, mockContext, 'dice');

      expect(mockLogger.error).toHaveBeenCalled();
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
      const contextStr = warnArgs[2]; // "\nContext:" の次の引数
      const context = JSON.parse(contextStr);

      expect(context.command).toBe('test');
      expect(context.user).toBe('U123456');
      expect(context.channel).toBe('C789012');
      expect(context.channelType).toBe('channel');
      expect(context.timestamp).toBe('1234567890.123456');
      expect(context.errorName).toBe('ValidationError');
      expect(context.isRetryable).toBe(false);
      expect(context.customField).toBe('value');
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
      expect(infoArgs[0]).toBe('Command executed successfully');
    });

    it('should include context in log', () => {
      logCommandSuccess(mockLogger, 'group', {
        user: 'U123',
        groupName: 'test-group',
        operation: 'create',
      });

      const infoArgs = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      const contextStr = infoArgs[2];
      const context = JSON.parse(contextStr);

      expect(context.user).toBe('U123');
      expect(context.groupName).toBe('test-group');
      expect(context.operation).toBe('create');
    });
  });

  describe('logDebug', () => {
    it('should log debug message with command name', () => {
      logDebug(mockLogger, 'dice', 'Parsing dice command', { args: ['2d6'] });

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:dice');
      expect(mockLogger.debug).toHaveBeenCalled();

      const debugArgs = (mockLogger.debug as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(debugArgs[0]).toBe('Parsing dice command');
      expect(debugArgs[1]).toBe('\nData:');
    });

    it('should work without data parameter', () => {
      logDebug(mockLogger, 'help', 'Showing help text');

      expect(mockLogger.setName).toHaveBeenCalledWith('cmd:help');
      expect(mockLogger.debug).toHaveBeenCalledWith('Showing help text');
    });
  });
});
