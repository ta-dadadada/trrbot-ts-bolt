module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 日本語のコミットメッセージも許可（subject-caseを無効化）
    'subject-case': [0],
    // ヘッダーと本文/フッターの間に空行を必須にする
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
    // 許可されるコミットタイプを定義
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新機能
        'fix', // バグ修正
        'docs', // ドキュメント
        'style', // フォーマット等
        'refactor', // リファクタリング
        'perf', // パフォーマンス改善
        'test', // テスト追加・修正
        'build', // ビルドシステム
        'ci', // CI設定
        'chore', // その他の変更
        'revert', // revert
      ],
    ],
  },
};
