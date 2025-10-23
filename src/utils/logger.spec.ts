import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger, createLogger } from './logger';

describe('Pino-based logger', () => {
  let originalLogLevel: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // 環境変数を保存
    originalLogLevel = process.env.LOG_LEVEL;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // 環境変数を復元
    if (originalLogLevel !== undefined) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
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

    it('should log info messages without throwing', () => {
      expect(() => logger.info({ message: 'Test message' })).not.toThrow();
    });

    it('should log error messages without throwing', () => {
      expect(() => logger.error({ message: 'Error message' })).not.toThrow();
    });

    it('should log objects directly', () => {
      expect(() => logger.info({ message: 'Test', user: 'U123', count: 5 })).not.toThrow();
    });
  });

  describe('createLogger factory', () => {
    it('should create logger with specified module name', () => {
      const moduleLogger = createLogger('test-module');

      expect(moduleLogger).toBeDefined();
      expect(moduleLogger.setName).toBeDefined();
      expect(moduleLogger.getLevel).toBeDefined();
    });

    it('should create logger with correct log level', () => {
      process.env.LOG_LEVEL = 'debug';
      const moduleLogger = createLogger('debug-module');

      expect(moduleLogger.getLevel()).toBe('debug');
    });

    it('should default to info level when LOG_LEVEL not set', () => {
      delete process.env.LOG_LEVEL;
      const moduleLogger = createLogger('default-module');

      expect(moduleLogger.getLevel()).toBe('info');
    });
  });

  describe('log level from environment', () => {
    it('should respect debug level', () => {
      process.env.LOG_LEVEL = 'debug';
      const testLogger = createLogger('debug-test');

      expect(testLogger.getLevel()).toBe('debug');
    });

    it('should respect DEBUG level (uppercase)', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const testLogger = createLogger('debug-test-upper');

      expect(testLogger.getLevel()).toBe('debug'); // Pinoは小文字に変換
    });

    it('should respect info level', () => {
      process.env.LOG_LEVEL = 'info';
      const testLogger = createLogger('info-test');

      expect(testLogger.getLevel()).toBe('info');
    });

    it('should respect INFO level (uppercase)', () => {
      process.env.LOG_LEVEL = 'INFO';
      const testLogger = createLogger('info-test-upper');

      expect(testLogger.getLevel()).toBe('info');
    });

    it('should respect warn level', () => {
      process.env.LOG_LEVEL = 'warn';
      const testLogger = createLogger('warn-test');

      expect(testLogger.getLevel()).toBe('warn');
    });

    it('should respect WARN level (uppercase)', () => {
      process.env.LOG_LEVEL = 'WARN';
      const testLogger = createLogger('warn-test-upper');

      expect(testLogger.getLevel()).toBe('warn');
    });

    it('should respect error level', () => {
      process.env.LOG_LEVEL = 'error';
      const testLogger = createLogger('error-test');

      expect(testLogger.getLevel()).toBe('error');
    });

    it('should respect ERROR level (uppercase)', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const testLogger = createLogger('error-test-upper');

      expect(testLogger.getLevel()).toBe('error');
    });

    it('should handle invalid LOG_LEVEL and default to info', () => {
      process.env.LOG_LEVEL = 'INVALID';
      const testLogger = createLogger('invalid-test');

      expect(testLogger.getLevel()).toBe('info');
    });
  });

  describe('logger formatting', () => {
    it('should handle string messages', () => {
      const testLogger = createLogger('format-test');
      expect(() => testLogger.info('Simple string message')).not.toThrow();
    });

    it('should handle object messages', () => {
      const testLogger = createLogger('format-test');
      expect(() => testLogger.info({ message: 'Object message', key: 'value' })).not.toThrow();
    });

    it('should handle JSON string messages', () => {
      const testLogger = createLogger('format-test');
      const jsonString = JSON.stringify({ message: 'JSON message', key: 'value' });
      expect(() => testLogger.info(jsonString)).not.toThrow();
    });
  });
});
