import React, { useState } from 'react';
import { Folder, GitBranch, Globe, RefreshCw, Sparkles, Download, Zap, History, ChevronDown, ChevronRight } from 'lucide-react';
import type { RepoStatus } from '../types';

interface RepoConfigPanelProps {
  repoStatus: RepoStatus;
  remoteUrl: string;
  branch: string;
  autoInit: boolean;
  forcePush: boolean;
  pullBeforePush: boolean;
  onRemoteUrlChange: (url: string) => void;
  onBranchChange: (branch: string) => void;
  onAutoInitChange: (val: boolean) => void;
  onForcePushChange: (val: boolean) => void;
  onPullBeforePushChange: (val: boolean) => void;
  onChangeFolder: () => void;
  onRescan: () => void;
}

export const RepoConfigPanel: React.FC<RepoConfigPanelProps> = ({
  repoStatus,
  remoteUrl,
  branch,
  autoInit,
  forcePush,
  pullBeforePush,
  onRemoteUrlChange,
  onBranchChange,
  onAutoInitChange,
  onForcePushChange,
  onPullBeforePushChange,
  onChangeFolder,
  onRescan,
}) => {
  const [showCommits, setShowCommits] = useState(false);
  return (
    <div className="p-4 rounded-xl neon-acrylic-cyan space-y-4">
      {/* Folder Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-neon_cyan-500/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0c1830] border border-neon_cyan-500/50 flex items-center justify-center text-neon_cyan-400 flex-shrink-0 shadow-neon-cyan">
            <Folder className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground-primary truncate">
                {repoStatus.folderName}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  repoStatus.isGitRepo
                    ? 'bg-neon_cyan-500/10 text-neon_cyan-400 border-neon_cyan-500/40'
                    : 'bg-neon_amber-400/10 text-neon_amber-400 border-neon_amber-400/40'
                }`}
              >
                {repoStatus.isGitRepo ? 'Git リポジトリ' : '新規フォルダ (未初期化)'}
              </span>
            </div>
            <div className="text-xs text-foreground-muted font-mono truncate" title={repoStatus.path}>
              {repoStatus.path}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onRescan}
            className="p-1.5 rounded bg-background-surface hover:bg-[#0f1d38] border border-neon_cyan-500/20 hover:border-neon_cyan-500/50 text-foreground-secondary hover:text-neon_cyan-400 transition-colors"
            title="再スキャン"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onChangeFolder}
            className="px-2.5 py-1 rounded bg-neon_cyan-500/10 hover:bg-neon_cyan-500/20 border border-neon_cyan-500/30 hover:border-neon_cyan-500/60 text-xs font-mono text-neon_cyan-400 transition-colors"
          >
            フォルダ変更
          </button>
        </div>
      </div>

      {/* Recent Git Commits Accordion */}
      {repoStatus.isGitRepo && repoStatus.recentCommits && repoStatus.recentCommits.length > 0 && (
        <div className="rounded-lg bg-[#040915] border border-neon_cyan-500/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCommits(!showCommits)}
            className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-mono text-foreground-secondary hover:text-neon_cyan-300 hover:bg-neon_cyan-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-neon_cyan-400" />
              <span>直近のコミット履歴 ({repoStatus.recentCommits.length}件)</span>
            </div>
            {showCommits ? (
              <ChevronDown className="w-3.5 h-3.5 text-neon_cyan-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
            )}
          </button>

          {showCommits && (
            <div className="px-3 pb-2 pt-1 border-t border-neon_cyan-500/10 divide-y divide-neon_cyan-500/10 font-mono">
              {repoStatus.recentCommits.map((c) => (
                <div key={c.hash} className="py-1.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-1.5 py-0.5 rounded bg-neon_cyan-500/10 text-neon_cyan-400 border border-neon_cyan-500/30 text-[10px] font-bold flex-shrink-0">
                      {c.hash}
                    </span>
                    <span className="text-foreground-primary truncate text-xs" title={c.message}>
                      {c.message}
                    </span>
                  </div>
                  <div className="text-[10px] text-foreground-muted flex-shrink-0 flex items-center gap-2">
                    <span>{c.author_name}</span>
                    <span>•</span>
                    <span>{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Target Remote URL */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono font-medium text-foreground-secondary flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-neon_cyan-400" />
            <span>プッシュ先リポジトリ URL *</span>
          </label>
          <span className="text-[10px] font-mono text-foreground-muted">例: https://github.com/ユーザー名/リポ名.git</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={remoteUrl}
            onChange={(e) => onRemoteUrlChange(e.target.value)}
            placeholder="https://github.com/username/repository.git"
            className="w-full px-3 py-2 rounded-lg bg-background-base border border-neon_cyan-500/30 focus:border-neon_cyan-500 text-xs font-mono text-neon_cyan-300 outline-none transition-all placeholder:text-foreground-muted shadow-inner"
          />
        </div>
      </div>

      {/* Branch & Auto Init options */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-xs font-mono text-foreground-secondary mb-1 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-neon_cyan-400" />
            <span>プッシュ先ブランチ</span>
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => onBranchChange(e.target.value)}
            placeholder="main"
            className="w-full px-3 py-1.5 rounded-lg bg-background-base border border-neon_cyan-500/30 focus:border-neon_cyan-500 text-xs font-mono text-foreground-primary outline-none shadow-inner"
          />
        </div>

        <div className="flex flex-col justify-center space-y-1.5 pt-1">
          {!repoStatus.isGitRepo && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground-secondary font-mono">
              <input
                type="checkbox"
                checked={autoInit}
                onChange={(e) => onAutoInitChange(e.target.checked)}
                className="rounded border-neon_cyan-500/40 bg-background-base text-neon_cyan-500 focus:ring-0 focus:ring-offset-0"
              />
              <span className="flex items-center gap-1 text-neon_cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>自動で git init を実行</span>
              </span>
            </label>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground-secondary font-mono">
            <input
              type="checkbox"
              checked={pullBeforePush}
              onChange={(e) => onPullBeforePushChange(e.target.checked)}
              className="rounded border-neon_cyan-500/40 bg-background-base text-neon_cyan-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1 text-neon_cyan-300">
              <Download className="w-3.5 h-3.5" />
              <span>リモートの既存ファイル（LICENSE/README）を自動統合</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground-secondary font-mono">
            <input
              type="checkbox"
              checked={forcePush}
              onChange={(e) => onForcePushChange(e.target.checked)}
              className="rounded border-neon_amber-400/40 bg-background-base text-neon_amber-400 focus:ring-0 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1 text-neon_amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>強制プッシュ (--force: リモート内容を完全上書き)</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
