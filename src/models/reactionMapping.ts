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
