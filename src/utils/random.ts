/**
 * 配列からランダムに1つの要素を選択する
 * @param items 選択対象の配列
 * @returns ランダムに選択された要素、配列が空の場合はundefined
 */
export const getRandomItem = <T>(items: T[]): T | undefined => {
  if (items.length === 0) {
    return undefined;
  }
  
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
};

/**
 * 指定された範囲内でランダムな整数を生成する
 * @param min 最小値（含む）
 * @param max 最大値（含む）
 * @returns min以上max以下のランダムな整数
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 配列の要素をランダムにシャッフルする（Fisher-Yatesアルゴリズム）
 * @param array シャッフルする配列
 * @returns シャッフルされた新しい配列（元の配列は変更されない）
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  // 元の配列をコピーして新しい配列を作成
  const shuffled = [...array];
  
  // Fisher-Yatesアルゴリズムでシャッフル
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // 要素を入れ替え
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

/**
 * 指定された長さのランダムな英数字文字列を生成する
 * @param length 生成する文字列の長さ
 * @returns ランダムな英数字文字列
 */
export const getRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
};

/**
 * 指定された長さのランダムな英数字と記号を含む文字列を生成する
 * @param length 生成する文字列の長さ
 * @returns ランダムな英数字と記号を含む文字列
 */
export const getRandomStringWithSymbols = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
};

/**
 * 文字列をスペースで分割し、コマンド名と引数に分ける
 * @param text 分割する文字列
 * @returns [コマンド名, ...引数]
 */
export const parseCommand = (text: string): string[] => {
  return text.trim().split(/\s+/);
};