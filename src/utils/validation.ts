/**
 * バリデーションエラークラス
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * トリガーテキストのバリデーション
 * @param text トリガーテキスト
 * @returns トリム後のテキスト
 * @throws {ValidationError} バリデーションエラー
 */
export function validateTriggerText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('トリガーテキストを入力してください');
  }

  if (trimmed.length > 100) {
    throw new ValidationError('トリガーテキストは100文字以内で入力してください');
  }

  // 制御文字のチェック（改行、タブは許可）
  // 制御文字は \x00-\x1F と \x7F-\x9F の範囲
  // 改行(\n=\x0A, \r=\x0D)とタブ(\t=\x09)は除外
  const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
  if (controlCharPattern.test(trimmed)) {
    throw new ValidationError('トリガーテキストに不正な制御文字が含まれています');
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
    throw new ValidationError('グループ名を入力してください');
  }

  if (trimmed.length > 50) {
    throw new ValidationError('グループ名は50文字以内で入力してください');
  }

  // 制御文字のチェック（改行、タブは許可）
  const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
  if (controlCharPattern.test(trimmed)) {
    throw new ValidationError('グループ名に不正な制御文字が含まれています');
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
    throw new ValidationError('アイテムテキストを入力してください');
  }

  if (trimmed.length > 200) {
    throw new ValidationError('アイテムテキストは200文字以内で入力してください');
  }

  // 制御文字のチェック（改行、タブは許可）
  const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
  if (controlCharPattern.test(trimmed)) {
    throw new ValidationError('アイテムテキストに不正な制御文字が含まれています');
  }

  return trimmed;
}
