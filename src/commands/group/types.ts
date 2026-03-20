import { CommandContext } from '../types';
import type { IGroupService } from '../../features/group';
import type { ReplyOptions } from '../utils';

/**
 * グループサブコマンドのコンテキスト
 * CommandContext を拡張して、groupService と subcommandArgs を追加
 */
export interface GroupSubcommandContext extends CommandContext {
  groupService: IGroupService;
  subcommandArgs: string[]; // サブコマンド以降の引数
  replyOptions: ReplyOptions;
}

/**
 * グループサブコマンドハンドラーの型
 */
export type GroupSubcommandHandler = (context: GroupSubcommandContext) => Promise<void>;
