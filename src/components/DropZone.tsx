import React, { useState } from 'react';
import { FolderSearch, HardDrive, ArrowDown, Clock, Folder } from 'lucide-react';
import appIcon from '../assets/icon.png';

interface DropZoneProps {
  onFolderSelected: (folderPath: string) => void;
  recentFolders?: string[];
}

export const DropZone: React.FC<DropZoneProps> = ({ onFolderSelected, recentFolders = [] }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      let folderPath = '';

      if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
        folderPath = window.electronAPI.getPathForFile(file);
      }

      if (!folderPath) {
        folderPath = (file as unknown as { path?: string }).path || '';
      }

      if (folderPath) {
        onFolderSelected(folderPath);
      }
    }
  };

  const handleBrowseFolder = async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFolder();
      if (selected) {
        onFolderSelected(selected);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-[520px] rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer ${
        isDragging
          ? 'bg-[#071329]/95 border-2 border-neon_cyan-500 shadow-neon-cyan-strong scale-[0.99]'
          : 'neon-acrylic-cyan border-2 border-dashed border-neon_cyan-500/30 hover:border-neon_cyan-400 hover:shadow-neon-cyan'
      }`}
      onClick={handleBrowseFolder}
    >
      {/* Decorative cyber corner accents: Cyan on left, Magenta on right */}
      <div className="absolute top-3.5 left-3.5 w-4 h-4 border-t-2 border-l-2 border-neon_cyan-500 shadow-neon-cyan" />
      <div className="absolute top-3.5 right-3.5 w-4 h-4 border-t-2 border-r-2 border-neon_magenta-500 shadow-neon-magenta" />
      <div className="absolute bottom-3.5 left-3.5 w-4 h-4 border-b-2 border-l-2 border-neon_cyan-500 shadow-neon-cyan" />
      <div className="absolute bottom-3.5 right-3.5 w-4 h-4 border-b-2 border-r-2 border-neon_magenta-500 shadow-neon-magenta" />

      {/* Main Icon */}
      <div className="relative mb-6">
        <img
          src={appIcon}
          alt="GithubPusher Icon"
          className="w-24 h-24 rounded-2xl border-2 border-neon_cyan-500/70 object-cover shadow-neon-cyan-strong"
        />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-neon_cyan-500/20 border border-neon_cyan-500 flex items-center justify-center text-neon_cyan-400 animate-bounce shadow-neon-cyan">
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <h2 className="text-xl font-bold tracking-wide text-foreground-primary mb-2 neon-glow-cyan font-mono">
        プロジェクトフォルダをドラッグ＆ドロップ
      </h2>
      <p className="text-sm text-foreground-secondary max-w-md mb-6 leading-relaxed">
        プッシュしたいリポジトリやフォルダをここに放り込むだけで、アカウント選択と除外設定が自動展開されます
      </p>

      {/* Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleBrowseFolder();
        }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon_cyan-500/15 hover:bg-neon_cyan-500/25 border border-neon_cyan-500/50 hover:border-neon_cyan-500 text-neon_cyan-400 font-mono text-sm tracking-wide transition-all shadow-neon-cyan hover:scale-105"
      >
        <FolderSearch className="w-4 h-4" />
        <span>フォルダを手動で参照する</span>
      </button>

      {/* Recent Repositories */}
      {recentFolders.length > 0 && (
        <div className="mt-5 w-full max-w-md text-left pt-4 border-t border-neon_cyan-500/20" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs font-mono text-foreground-muted mb-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-neon_cyan-400" />
            <span>最近使用したリポジトリ:</span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {recentFolders.map((rf) => (
              <button
                key={rf}
                type="button"
                onClick={() => onFolderSelected(rf)}
                className="w-full text-left px-2.5 py-1.5 rounded-md bg-background-base/60 hover:bg-background-surface border border-neon_cyan-500/15 hover:border-neon_cyan-500/40 text-xs font-mono text-foreground-secondary hover:text-neon_cyan-400 flex items-center gap-2 truncate transition-colors shadow-sm"
                title={rf}
              >
                <Folder className="w-3.5 h-3.5 text-neon_cyan-400 flex-shrink-0" />
                <span className="truncate">{rf}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 flex items-center gap-2 text-xs text-foreground-muted font-mono">
        <HardDrive className="w-3.5 h-3.5 text-neon_cyan-500/60" />
        <span>Windows ローカル環境でセキュアに処理されます</span>
      </div>
    </div>
  );
};
