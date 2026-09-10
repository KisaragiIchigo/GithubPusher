import React from 'react';
import { Minus, X, User, Settings, FolderOpen, ArrowLeft } from 'lucide-react';
import type { GitHubAccount } from '../types';
import appIcon from '../assets/icon.png';

interface HeaderProps {
  currentAccount: GitHubAccount | null;
  hasSelectedFolder: boolean;
  onOpenAccountSelector: () => void;
  onOpenAccountManager: () => void;
  onClearFolder: () => void;
  onOpenFolderDialog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentAccount,
  hasSelectedFolder,
  onOpenAccountSelector,
  onOpenAccountManager,
  onClearFolder,
  onOpenFolderDialog,
}) => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <header className="h-10 bg-background-base/95 border-b border-neon_cyan-500/20 flex items-center justify-between px-3 titlebar-drag select-none z-50">
      {/* Brand & Status LED */}
      <div className="flex items-center gap-2.5">
        <img
          src={appIcon}
          alt="GithubPusher Icon"
          className="w-6 h-6 rounded-md border border-neon_cyan-500/50 object-cover shadow-neon-cyan"
        />
        <span className="font-mono text-xs font-bold tracking-wider text-neon_cyan-400 neon-glow-cyan">
          GITHUB PUSHER
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon_cyan-500/10 text-neon_cyan-400 border border-neon_cyan-500/30">
          CYBER-01
        </span>

        {/* Quick Folder Switch Actions */}
        <div className="flex items-center gap-1.5 ml-3 titlebar-no-drag">
          {hasSelectedFolder && (
            <button
              type="button"
              onClick={onClearFolder}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-neon_cyan-500/10 hover:bg-neon_cyan-500/20 border border-neon_cyan-500/30 hover:border-neon_cyan-500/60 text-[11px] font-mono text-neon_cyan-400 transition-all shadow-sm"
              title="別のフォルダを選ぶ画面に戻る"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>フォルダ選択に戻る</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenFolderDialog}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-background-surface hover:bg-[#0f1d38] border border-neon_cyan-500/20 hover:border-neon_cyan-500/40 text-[11px] font-mono text-foreground-secondary hover:text-foreground-primary transition-all"
            title="フォルダを手動で開く"
          >
            <FolderOpen className="w-3 h-3 text-neon_cyan-400" />
            <span>開く</span>
          </button>
        </div>
      </div>

      {/* Account Badge & Window Controls */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {/* Current Account Indicator */}
        <button
          type="button"
          onClick={onOpenAccountSelector}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-background-surface hover:bg-[#0f1d38] border border-neon_cyan-500/30 hover:border-neon_cyan-500/60 text-xs text-foreground-primary transition-colors shadow-sm"
          title="クリックしてアカウントを切り替え"
        >
          <User className="w-3.5 h-3.5 text-neon_cyan-400" />
          <span className="font-mono max-w-[130px] truncate">
            {currentAccount ? currentAccount.username : 'アカウント未選択'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-neon_cyan-400 animate-pulse shadow-neon-cyan" />
        </button>

        <button
          type="button"
          onClick={onOpenAccountManager}
          className="p-1 rounded text-foreground-muted hover:text-neon_cyan-400 hover:bg-[#0f1d38] transition-colors"
          title="アカウント一覧・PAT管理"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-neon_cyan-500/20 mx-1" />

        {/* Window controls */}
        <button
          type="button"
          onClick={handleMinimize}
          className="p-1 rounded text-foreground-muted hover:text-foreground-primary hover:bg-[#0f1d38] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded text-foreground-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
