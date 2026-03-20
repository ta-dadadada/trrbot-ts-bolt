import { CommandContext } from '../types';
import type { IReactionService } from '../../features/reaction';
import type { ReplyOptions } from '../utils';

/**
 * リアクションサブコマンドのコンテキスト
 * CommandContext を拡張して、reactionService と subcommandArgs を追加
 */
export interface ReactionSubcommandContext extends CommandContext {
  reactionService: IReactionService;
  subcommandArgs: string[]; // サブコマンド以降の引数
  replyOptions: ReplyOptions;
}

/**
 * リアクションサブコマンドハンドラーの型
 */
export type ReactionSubcommandHandler = (context: ReactionSubcommandContext) => Promise<void>;
