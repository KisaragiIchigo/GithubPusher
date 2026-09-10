import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { PushLog } from '../types';

interface CommitAndPushPanelProps {
  commitMessage: string;
  isPushing: boolean;
  pushLogs: PushLog[];
  canPush: boolean;
  onCommitMessageChange: (msg: string) => void;
  onExecutePush: () => void;
  onGenerateDefaultMessage: () => void;
}

export const CommitAndPushPanel: React.FC<CommitAndPushPanelProps> = ({
  commitMessage,
  isPushing,
  pushLogs,
  canPush,
  onCommitMessageChange,
  onExecutePush,
  onGenerateDefaultMessage,
}) => {
  const [showLogs, setShowLogs] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pushLogs]);

  return (
    <div className="p-4 rounded-xl neon-acrylic-cyan space-y-3.5">
      {/* Commit Message & Push Action */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono text-foreground-secondary">コミットメッセージ</label>
            <button
              type="button"
              onClick={onGenerateDefaultMessage}
              className="flex items-center gap-1 text-[11px] font-mono text-neon_cyan-400 hover:text-neon_cyan-300 hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>自動生成（日時）</span>
            </button>
          </div>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="コミットメッセージを入力..."
            className="w-full px-3 py-2 rounded-lg bg-background-base border border-neon_cyan-500/30 focus:border-neon_cyan-500 text-xs font-mono text-foreground-primary outline-none shadow-inner"
            disabled={isPushing}
          />
        </div>

        <button
          type="button"
          onClick={onExecutePush}
          disabled={!canPush || isPushing}
          className={`h-9 px-6 rounded-lg font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            !canPush || isPushing
              ? 'bg-[#0b1220] text-foreground-muted border border-neon_cyan-500/10 cursor-not-allowed'
              : 'bg-neon_cyan-500 text-background-base hover:bg-neon_cyan-300 shadow-neon-cyan-strong hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isPushing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-background-base" />
              <span>プッシュ実行中...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>プッシュ実行</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Log Inspector */}
      <div>
        <div className="flex items-center justify-between mb-1 text-[11px] font-mono text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-neon_cyan-400" />
            <span>リアルタイム実行コンソール</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="hover:text-neon_cyan-400 transition-colors"
          >
            {showLogs ? '最小化' : '展開'}
          </button>
        </div>

        {showLogs && (
          <div className="h-28 overflow-y-auto rounded-lg bg-[#02050c] border border-neon_cyan-500/20 p-2.5 font-mono text-[11px] space-y-1 shadow-inner">
            {pushLogs.length === 0 ? (
              <div className="text-[#2d4263] italic py-1">
                待機中... プッシュボタンを押すとログがここにリアルタイムストリームされます。
              </div>
            ) : (
              pushLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-tight">
                  <span className="text-[#2d4263] flex-shrink-0">[{log.timestamp}]</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-neon_cyan-400 flex-shrink-0" />}
                    {log.type === 'error' && <AlertCircle className="w-3 h-3 text-status-error flex-shrink-0" />}
                    {log.type === 'warning' && <AlertCircle className="w-3 h-3 text-neon_amber-400 flex-shrink-0" />}
                    <span
                      className={`break-all ${
                        log.type === 'success'
                          ? 'text-neon_cyan-400 font-semibold'
                          : log.type === 'error'
                          ? 'text-status-error font-semibold'
                          : log.type === 'warning'
                          ? 'text-neon_amber-400'
                          : log.type === 'step'
                          ? 'text-neon_cyan-300'
                          : 'text-foreground-secondary'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        )}

        {pushLogs.some((l) => l.type === 'error' && (l.message.includes('fetch first') || l.message.includes('rejected') || l.message.includes('リモート'))) && (
          <div className="mt-2 p-2 rounded bg-neon_amber-400/10 border border-neon_amber-400/30 text-xs font-mono text-neon_amber-400 flex items-center justify-between">
            <span>💡 リモートの既存ファイル（LICENSE/README等）との統合または強制プッシュ（--force）が選択可能です。</span>
          </div>
        )}
      </div>
    </div>
  );
};
