export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 日本語のコミットメッセージも許可
    'subject-case': [0],
    // bodyとfooterで日本語を使用可能にする
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
    // typeの制限を緩和（カスタムtypeを許可）
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
