import { describe, it, expect } from 'vitest';
import {
  validateTriggerText,
  validateGroupName,
  validateItemText,
  ValidationError,
} from './validation';

describe('validateTriggerText', () => {
  it('正常な文字列を受け入れる', () => {
    expect(validateTriggerText('こんにちは')).toBe('こんにちは');
    expect(validateTriggerText('hello')).toBe('hello');
    expect(validateTriggerText('123')).toBe('123');
  });

  it('前後の空白をトリムする', () => {
    expect(validateTriggerText('  hello  ')).toBe('hello');
    expect(validateTriggerText('\thello\n')).toBe('hello');
  });

  it('空文字列の場合はエラーをスローする', () => {
    expect(() => validateTriggerText('')).toThrow(ValidationError);
    expect(() => validateTriggerText('   ')).toThrow(ValidationError);
  });

  it('100文字を超える場合はエラーをスローする', () => {
    const longText = 'a'.repeat(101);
    expect(() => validateTriggerText(longText)).toThrow(ValidationError);
  });

  it('100文字ちょうどは受け入れる', () => {
    const maxText = 'a'.repeat(100);
    expect(validateTriggerText(maxText)).toBe(maxText);
  });

  it('制御文字を含む場合はエラーをスローする', () => {
    expect(() => validateTriggerText('hello\x00world')).toThrow(ValidationError);
    expect(() => validateTriggerText('test\x01')).toThrow(ValidationError);
    expect(() => validateTriggerText('\x1Ftest')).toThrow(ValidationError);
  });

  it('改行文字は許可する（制御文字だが一般的に使用される）', () => {
    expect(validateTriggerText('hello\nworld')).toBe('hello\nworld');
    expect(validateTriggerText('test\r\nline')).toBe('test\r\nline');
  });

  it('タブ文字は許可する', () => {
    expect(validateTriggerText('hello\tworld')).toBe('hello\tworld');
  });
});

describe('validateGroupName', () => {
  it('正常な文字列を受け入れる', () => {
    expect(validateGroupName('グループ1')).toBe('グループ1');
    expect(validateGroupName('team-alpha')).toBe('team-alpha');
  });

  it('前後の空白をトリムする', () => {
    expect(validateGroupName('  group  ')).toBe('group');
  });

  it('空文字列の場合はエラーをスローする', () => {
    expect(() => validateGroupName('')).toThrow(ValidationError);
    expect(() => validateGroupName('   ')).toThrow(ValidationError);
  });

  it('50文字を超える場合はエラーをスローする', () => {
    const longName = 'a'.repeat(51);
    expect(() => validateGroupName(longName)).toThrow(ValidationError);
  });

  it('50文字ちょうどは受け入れる', () => {
    const maxName = 'a'.repeat(50);
    expect(validateGroupName(maxName)).toBe(maxName);
  });

  it('制御文字を含む場合はエラーをスローする', () => {
    expect(() => validateGroupName('group\x00name')).toThrow(ValidationError);
  });
});

describe('validateItemText', () => {
  it('正常な文字列を受け入れる', () => {
    expect(validateItemText('アイテム1')).toBe('アイテム1');
    expect(validateItemText('item-123')).toBe('item-123');
  });

  it('前後の空白をトリムする', () => {
    expect(validateItemText('  item  ')).toBe('item');
  });

  it('空文字列の場合はエラーをスローする', () => {
    expect(() => validateItemText('')).toThrow(ValidationError);
    expect(() => validateItemText('   ')).toThrow(ValidationError);
  });

  it('200文字を超える場合はエラーをスローする', () => {
    const longText = 'a'.repeat(201);
    expect(() => validateItemText(longText)).toThrow(ValidationError);
  });

  it('200文字ちょうどは受け入れる', () => {
    const maxText = 'a'.repeat(200);
    expect(validateItemText(maxText)).toBe(maxText);
  });

  it('制御文字を含む場合はエラーをスローする', () => {
    expect(() => validateItemText('item\x00text')).toThrow(ValidationError);
  });
});

describe('ValidationError', () => {
  it('カスタムエラークラスとして動作する', () => {
    const error = new ValidationError('内部エラーメッセージ', 'ユーザー向けエラーメッセージ');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('内部エラーメッセージ');
    expect(error.userMessage).toBe('ユーザー向けエラーメッセージ');
    expect(error.name).toBe('ValidationError');
  });
});
