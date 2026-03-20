/**
 * リアクションマッピングの型定義
 */
export interface ReactionMapping {
  id: number;
  triggerText: string;
  reaction: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * リアクションマッピングの作成用データの型定義
 */
export interface CreateReactionMappingData {
  triggerText: string;
  reaction: string;
}
