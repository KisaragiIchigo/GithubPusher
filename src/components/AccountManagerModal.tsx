import React, { useState } from 'react';
import { X, Key, Trash2, ExternalLink, Plus, CheckCircle, ShieldAlert } from 'lucide-react';
import type { GitHubAccount } from '../types';

interface AccountManagerModalProps {
  isOpen: boolean;
  accounts: GitHubAccount[];
  onSaveAccount: (account: GitHubAccount) => void;
  onDeleteAccount: (id: string) => void;
  onClose: () => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  accounts,
  onSaveAccount,
  onDeleteAccount,
  onClose,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !token.trim()) {
      setErrorMessage('ユーザー名とPersonal Access Tokenは必須です。');
      return;
    }

    const newAccount: GitHubAccount = {
      id: Math.random().toString(36).substring(2, 11),
      username: username.trim(),
      displayName: displayName.trim() || username.trim(),
      email: email.trim() || `${username.trim()}@users.noreply.github.com`,
      token: token.trim(),
    };

    onSaveAccount(newAccount);
    setUsername('');
    setDisplayName('');
    setEmail('');
    setToken('');
    setErrorMessage('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[500px] bg-[#070e1e]/95 border border-neon_cyan-500/40 rounded-xl shadow-neon-cyan p-6 text-foreground-primary">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neon_cyan-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-neon_cyan-400" />
            <h3 className="text-base font-bold text-foreground-primary font-mono">GitHub アカウント管理</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-foreground-muted hover:text-foreground-primary hover:bg-[#0f1d38] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-neon_cyan-500/10 border border-neon_cyan-500/30 text-xs text-foreground-secondary mb-4 font-mono">
          <ShieldAlert className="w-4 h-4 text-neon_cyan-400 flex-shrink-0 mt-0.5" />
          <span>
            トークンはキミのPCローカルにのみ保存され、外部サーバやAIチャットには一切送信されません。
          </span>
        </div>

        {!isAdding ? (
          <div>
            {/* Accounts List */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 mb-5">
              {accounts.length === 0 ? (
                <div className="py-8 text-center text-xs text-foreground-muted font-mono">
                  登録されたアカウントがありません。<br />下のボタンから追加してください。
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-base/80 border border-neon_cyan-500/15 hover:border-neon_cyan-500/40 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-neon_cyan-400 font-mono">
                        {acc.username}
                        {acc.displayName && acc.displayName !== acc.username && (
                          <span className="ml-2 text-xs font-normal text-foreground-secondary">({acc.displayName})</span>
                        )}
                      </div>
                      <div className="text-xs text-foreground-muted font-mono mt-0.5">{acc.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1.5 rounded text-status-error hover:bg-status-error/10 transition-colors"
                      title="アカウントを削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neon_cyan-500/15">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon_cyan-500 text-background-base font-semibold text-xs hover:bg-neon_cyan-300 shadow-neon-cyan transition-all font-mono"
              >
                <Plus className="w-4 h-4" />
                <span>新規アカウントを追加</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-background-surface border border-neon_cyan-500/20 text-xs text-foreground-secondary hover:text-foreground-primary font-mono transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : (
          /* Add Account Form */
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="p-2 rounded bg-status-error/10 border border-status-error/40 text-xs text-status-error font-mono">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-foreground-secondary mb-1">GitHub ユーザー名 *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例: octocat"
                className="w-full px-3 py-1.5 rounded-lg bg-background-base border border-neon_cyan-500/25 focus:border-neon_cyan-500 text-sm text-foreground-primary font-mono outline-none transition-all shadow-inner"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono text-foreground-secondary mb-1">表示名（任意）</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: 個人用 / 仕事用"
                  className="w-full px-3 py-1.5 rounded-lg bg-background-base border border-neon_cyan-500/25 focus:border-neon_cyan-500 text-sm text-foreground-primary font-mono outline-none transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-foreground-secondary mb-1">コミット用メール（任意）</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-background-base border border-neon_cyan-500/25 focus:border-neon_cyan-500 text-sm text-foreground-primary font-mono outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-foreground-secondary">Personal Access Token (PAT) *</label>
                <button
                  type="button"
                  onClick={() => {
                    if (window.electronAPI) {
                      window.electronAPI.openExternal('https://github.com/settings/tokens/new?scopes=repo&description=GithubPusher');
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] text-neon_cyan-400 font-mono hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  <span>トークン発行 (repo権限)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-1.5 rounded-lg bg-background-base border border-neon_cyan-500/25 focus:border-neon_cyan-500 text-sm text-foreground-primary font-mono outline-none transition-all shadow-inner"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded bg-background-surface border border-neon_cyan-500/20 text-xs text-foreground-secondary hover:text-foreground-primary font-mono"
              >
                戻る
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neon_cyan-500 text-background-base font-semibold text-xs hover:bg-neon_cyan-300 shadow-neon-cyan font-mono transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>アカウントを保存</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
