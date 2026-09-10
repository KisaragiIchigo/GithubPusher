import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  FileCode, 
  Filter, 
  Save, 
  Layers, 
  Check,
  AlertTriangle,
  Tag
} from 'lucide-react';
import type { ChangedFile } from '../types';

interface ExclusionManagerProps {
  files: ChangedFile[];
  excludedPatterns: string[];
  hasSensitiveFiles: boolean;
  sensitiveFiles: string[];
  onToggleFileExclusion: (path: string) => void;
  onAddPresetPatterns: (patterns: string[]) => void;
  onSaveGitignore: () => void;
}

const PRESETS = [
  {
    name: 'AI作業ファイル (changelogs, style等)',
    patterns: ['changelogs.json', 'project_style.json', 'implementation_plan.md', 'walkthrough.md', '.gemini/'],
  },
  {
    name: 'Node.js',
    patterns: ['node_modules/', 'dist/', '.env', '.env.*', '.turbo/'],
  },
  {
    name: 'Python',
    patterns: ['__pycache__/', '*.pyc', '.venv/', 'venv/', 'env/'],
  },
  {
    name: 'OS / ゴミファイル (desktop.ini等)',
    patterns: ['desktop.ini', 'Thumbs.db', 'ehthumbs.db', '.DS_Store', '*.log', '*.tmp/'],
  },
];

export const ExclusionManager: React.FC<ExclusionManagerProps> = ({
  files,
  excludedPatterns,
  hasSensitiveFiles,
  sensitiveFiles,
  onToggleFileExclusion,
  onAddPresetPatterns,
  onSaveGitignore,
}) => {
  const [filterText, setFilterText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleSaveToGitignore = () => {
    onSaveGitignore();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExcludeAllSensitive = () => {
    onAddPresetPatterns(['.env', '.env.*', '*.pem', '*.key', 'credentials.json']);
  };

  return (
    <div className="p-4 rounded-xl neon-acrylic-magenta space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neon_magenta-500/20">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neon_magenta-400" />
          <h3 className="text-sm font-bold text-foreground-primary font-mono">プッシュ除外フィルター</h3>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-neon_magenta-500/15 text-neon_magenta-400 border border-neon_magenta-500/30">
            {files.filter((f) => f.isExcluded).length} 件除外
          </span>
        </div>

        <button
          type="button"
          onClick={handleSaveToGitignore}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all border ${
            savedSuccess
              ? 'bg-neon_magenta-500/20 border-neon_magenta-500 text-neon_magenta-400 shadow-neon-magenta'
              : 'bg-[#150b24] hover:bg-[#22123d] border-neon_magenta-500/30 hover:border-neon_magenta-500/60 text-foreground-secondary hover:text-neon_magenta-400'
          }`}
          title="現在の除外ルールをプロジェクトの .gitignore に反映"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? '反映完了！' : '.gitignore に保存'}</span>
        </button>
      </div>

      {/* Sensitive File Alert Banner */}
      {hasSensitiveFiles && (
        <div className="p-3 rounded-lg bg-neon_amber-400/10 border border-neon_amber-400/40 flex items-start justify-between gap-3 text-xs font-mono text-neon_amber-400 animate-pulse">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">機密ファイルが検出されました！</div>
              <div className="text-[11px] text-neon_amber-400/80 mt-0.5 truncate max-w-[340px]">
                {sensitiveFiles.join(', ')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExcludeAllSensitive}
            className="flex-shrink-0 px-2.5 py-1 rounded bg-neon_amber-400/20 hover:bg-neon_amber-400/30 border border-neon_amber-400/60 text-xs font-bold transition-colors"
          >
            一括除外する
          </button>
        </div>
      )}

      {/* Quick Preset Buttons */}
      <div>
        <div className="text-[11px] font-mono text-foreground-muted mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-neon_magenta-400" />
          <span>プリセット除外（ワンクリック追加）:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onAddPresetPatterns(preset.patterns)}
              className="px-2 py-1 rounded bg-[#100720] hover:bg-[#1e0e3b] border border-neon_magenta-500/25 hover:border-neon_magenta-500/50 text-xs font-mono text-foreground-secondary hover:text-neon_magenta-300 transition-all"
            >
              + {preset.name}
            </button>
          ))}
        </div>
        {excludedPatterns.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-neon_magenta-500/15">
            <span className="text-[10px] font-mono text-foreground-muted flex items-center gap-1">
              <Tag className="w-3 h-3 text-neon_magenta-400" />
              <span>適用パターン:</span>
            </span>
            {excludedPatterns.map((pat) => (
              <span
                key={pat}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon_magenta-500/10 text-neon_magenta-400 border border-neon_magenta-500/25"
              >
                {pat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* File Search & List */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono text-foreground-secondary">プッシュ対象ファイル一覧</span>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="ファイルを検索..."
            className="px-2 py-0.5 rounded bg-background-base border border-neon_magenta-500/25 focus:border-neon_magenta-500 text-[11px] font-mono text-foreground-primary outline-none w-36 placeholder:text-foreground-muted shadow-inner"
          />
        </div>

        {/* Scrollable files table */}
        <div className="max-h-[160px] overflow-y-auto rounded-lg bg-background-base/80 border border-neon_magenta-500/20 divide-y divide-neon_magenta-500/10 font-mono text-xs">
          {filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-foreground-muted">変更対象ファイルがありません</div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => onToggleFileExclusion(file.path)}
                className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                  file.isExcluded
                    ? 'bg-status-error/5 text-foreground-muted line-through'
                    : 'hover:bg-[#140b28] text-foreground-primary'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {file.isExcluded ? (
                    <Square className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" />
                  ) : (
                    <CheckSquare className="w-3.5 h-3.5 text-neon_magenta-400 flex-shrink-0" />
                  )}
                  <FileCode className="w-3.5 h-3.5 text-foreground-secondary flex-shrink-0" />
                  <span className="truncate">{file.path}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {file.isSensitive && (
                    <span className="text-[9px] px-1 rounded bg-neon_amber-400/10 text-neon_amber-400 border border-neon_amber-400/30">
                      機密
                    </span>
                  )}
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded uppercase ${
                      file.status === 'added' || file.status === 'untracked'
                        ? 'bg-neon_cyan-500/10 text-neon_cyan-400'
                        : file.status === 'modified'
                        ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                        : 'bg-status-error/10 text-status-error'
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
