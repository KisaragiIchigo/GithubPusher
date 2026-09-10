import React, { useState } from 'react';
import { X, HelpCircle, User, Plus, Check, Github } from 'lucide-react';
import type { GitHubAccount } from '../types';

interface AccountSelectorModalProps {
  isOpen: boolean;
  accounts: GitHubAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onClose: () => void;
  onAddNewAccount: () => void;
}

export const AccountSelectorModal: React.FC<AccountSelectorModalProps> = ({
  isOpen,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onClose,
  onAddNewAccount,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string | null>(selectedAccountId);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (currentSelected) {
      onSelectAccount(currentSelected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container matching uploaded screenshot */}
      <div className="relative w-full max-w-[380px] bg-[#070e1e]/95 border border-neon_cyan-500/40 rounded-xl shadow-neon-cyan overflow-hidden text-foreground-primary p-6">
        {/* Top bar with close */}
        <div className="flex items-center justify-between pb-3 border-b border-neon_cyan-500/20 mb-5">
          <span className="text-xs font-medium text-foreground-secondary font-mono">Select an account</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-foreground-muted hover:text-foreground-primary hover:bg-[#0f1d38] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GitHub Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Github className="w-6 h-6 text-foreground-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground-primary font-mono">GitHub</span>
          </div>
          <h3 className="text-base font-semibold text-foreground-primary">Select an account</h3>
        </div>

        {/* Question Link */}
        <button
          type="button"
          onClick={() => {
            if (window.electronAPI) {
              window.electronAPI.openExternal('https://docs.github.com/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-multiple-accounts');
            }
          }}
          className="flex items-center gap-1.5 text-xs text-neon_purple-400 hover:text-neon_purple-300 cursor-pointer mb-4 transition-colors bg-transparent border-0 p-0 text-left"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Why am I being asked to select an account?</span>
        </button>

        {/* Account List */}
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 mb-6">
          {accounts.length === 0 ? (
            <div className="py-6 text-center text-xs text-foreground-muted font-mono">
              登録されたアカウントがありません。<br />下の「Add a new account」から登録してください。
            </div>
          ) : (
            accounts.map((account) => {
              const isSelected = currentSelected === account.id;
              return (
                <div
                  key={account.id}
                  onClick={() => setCurrentSelected(account.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-neon_cyan-500/15 border-neon_cyan-500 text-neon_cyan-400 shadow-neon-cyan'
                      : 'bg-background-base/70 border-neon_cyan-500/15 hover:border-neon_cyan-500/40 hover:bg-[#0d1c33] text-foreground-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'border-neon_cyan-400 bg-neon_cyan-500/20 text-neon_cyan-400'
                          : 'border-foreground-muted/30 bg-[#0c1830] text-foreground-secondary'
                      }`}
                    >
                      <User className="w-4 h-4 stroke-[1.75]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate font-mono">{account.username}</div>
                      {account.displayName && (
                        <div className="text-[11px] text-foreground-muted truncate">{account.displayName}</div>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-neon_cyan-400 flex-shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!currentSelected}
          className={`w-full py-2 rounded-lg font-medium text-sm transition-all mb-3 font-mono ${
            currentSelected
              ? 'bg-neon_cyan-500 text-background-base hover:bg-neon_cyan-300 shadow-neon-cyan active:scale-[0.98]'
              : 'bg-[#0c1830] text-foreground-muted cursor-not-allowed border border-neon_cyan-500/10'
          }`}
        >
          Continue
        </button>

        {/* Add a new account Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddNewAccount();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-neon_magenta-400 hover:text-neon_magenta-300 transition-colors py-1 px-2 rounded hover:bg-neon_magenta-500/10 font-mono"
          >
            <Plus className="w-3 h-3" />
            <span>Add a new account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
