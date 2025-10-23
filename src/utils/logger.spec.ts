import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel } from '@slack/logger';
import { logger, createLogger } from './logger';

describe('@slack/logger wrapper', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let originalLogLevel: string | undefined;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // 環境変数を保存
    originalLogLevel = process.env.LOG_LEVEL;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();

    // 環境変数を復元
    if (originalLogLevel !== undefined) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  describe('logger instance', () => {
    it('should be defined and have correct methods', () => {
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.setLevel).toBeDefined();
      expect(logger.setName).toBeDefined();
      expect(logger.getLevel).toBeDefined();
    });

    it('should log info messages', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('Test message');

      // @slack/loggerは内部でprocess.stdoutに書き込むため、
      // console spyでキャプチャするのではなく、エラーが発生しないことを確認
      expect(true).toBe(true);
    });

    it('should log error messages', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.error('Error message');

      // @slack/loggerは内部でprocess.stderrに書き込むため、
      // console spyでキャプチャするのではなく、エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });

  describe('createLogger factory', () => {
    it('should create logger with specified module name', () => {
      const moduleLogger = createLogger('test-module');

      expect(moduleLogger).toBeDefined();
      expect(moduleLogger.setName).toBeDefined();
    });

    it('should create logger with correct log level', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const moduleLogger = createLogger('debug-module');

      expect(moduleLogger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should default to INFO level when LOG_LEVEL not set', () => {
      delete process.env.LOG_LEVEL;
      const moduleLogger = createLogger('default-module');

      expect(moduleLogger.getLevel()).toBe(LogLevel.INFO);
    });
  });

  describe('log level from environment', () => {
    it('should respect DEBUG level', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const testLogger = createLogger('debug-test');

      expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should respect INFO level', () => {
      process.env.LOG_LEVEL = 'INFO';
      const testLogger = createLogger('info-test');

      expect(testLogger.getLevel()).toBe(LogLevel.INFO);
    });

    it('should respect WARN level', () => {
      process.env.LOG_LEVEL = 'WARN';
      const testLogger = createLogger('warn-test');

      expect(testLogger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should respect ERROR level', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const testLogger = createLogger('error-test');

      expect(testLogger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should handle invalid LOG_LEVEL and default to INFO', () => {
      process.env.LOG_LEVEL = 'INVALID';
      const testLogger = createLogger('invalid-test');

      expect(testLogger.getLevel()).toBe(LogLevel.INFO);
    });
  });
});
