import { ValidationError } from './errors';

/**
 * 制御文字のチェックパターン（改行、タブは許可）
 * 制御文字は \u0000-\u001F と \u007F-\u009F の範囲
 * 改行(\n=\u000A, \r=\u000D)とタブ(\t=\u0009)は除外
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;

// ValidationErrorを再エクスポート（互換性のため）
export { ValidationError };

/**
 * トリガーテキストのバリデーション
 * @param text トリガーテキスト
 * @returns トリム後のテキスト
 * @throws {ValidationError} バリデーションエラー
 */
export function validateTriggerText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Empty trigger text', 'トリガーテキストを入力してください', {
      providedText: text,
    });
  }

  if (trimmed.length > 100) {
    throw new ValidationError(
      `Trigger text too long: ${trimmed.length} chars`,
      'トリガーテキストは100文字以内で入力してください',
      { providedLength: trimmed.length, maxLength: 100 },
    );
  }

  if (CONTROL_CHAR_PATTERN.test(trimmed)) {
    throw new ValidationError(
      'Invalid control characters in trigger text',
      'トリガーテキストに不正な制御文字が含まれています',
      { providedText: trimmed },
    );
  }

  return trimmed;
}

/**
 * グループ名のバリデーション
 * @param name グループ名
 * @returns トリム後のグループ名
 * @throws {ValidationError} バリデーションエラー
 */
export function validateGroupName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Empty group name', 'グループ名を入力してください', {
      providedName: name,
    });
  }

  if (trimmed.length > 50) {
    throw new ValidationError(
      `Group name too long: ${trimmed.length} chars`,
      'グループ名は50文字以内で入力してください',
      { providedLength: trimmed.length, maxLength: 50 },
    );
  }

  if (CONTROL_CHAR_PATTERN.test(trimmed)) {
    throw new ValidationError(
      'Invalid control characters in group name',
      'グループ名に不正な制御文字が含まれています',
      { providedName: trimmed },
    );
  }

  return trimmed;
}

/**
 * アイテムテキストのバリデーション
 * @param text アイテムテキスト
 * @returns トリム後のアイテムテキスト
 * @throws {ValidationError} バリデーションエラー
 */
export function validateItemText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Empty item text', 'アイテムテキストを入力してください', {
      providedText: text,
    });
  }

  if (trimmed.length > 200) {
    throw new ValidationError(
      `Item text too long: ${trimmed.length} chars`,
      'アイテムテキストは200文字以内で入力してください',
      { providedLength: trimmed.length, maxLength: 200 },
    );
  }

  if (CONTROL_CHAR_PATTERN.test(trimmed)) {
    throw new ValidationError(
      'Invalid control characters in item text',
      'アイテムテキストに不正な制御文字が含まれています',
      { providedText: trimmed },
    );
  }

  return trimmed;
}
