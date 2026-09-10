import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FolderUp } from 'lucide-react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { AccountSelectorModal } from './components/AccountSelectorModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { RepoConfigPanel } from './components/RepoConfigPanel';
import { ExclusionManager } from './components/ExclusionManager';
import { CommitAndPushPanel } from './components/CommitAndPushPanel';
import { ReleaseConfigPanel } from './components/ReleaseConfigPanel';
import type { GitHubAccount, RepoStatus, PushLog, ChangedFile, ReleaseOptions, PushResult } from './types';

export const App: React.FC = () => {
  const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);

  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [autoInit, setAutoInit] = useState(true);
  const [forcePush, setForcePush] = useState(false);
  const [pullBeforePush, setPullBeforePush] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [excludedPatterns, setExcludedPatterns] = useState<string[]>([
    'desktop.ini',
    'Thumbs.db',
    'changelogs.json',
    'project_style.json',
    'implementation_plan.md',
    'walkthrough.md',
    '.gemini/',
  ]);
  const [pushLogs, setPushLogs] = useState<PushLog[]>([]);
  const [isPushing, setIsPushing] = useState(false);
  const [lastPushResult, setLastPushResult] = useState<PushResult | null>(null);
  const [releaseOptions, setReleaseOptions] = useState<ReleaseOptions>({
    enabled: true,
    tagName: 'v1.0.0',
    releaseTitle: 'Release v1.0.0',
    selectedBinaryPaths: [],
  });

  // Recent repositories list persisted in localStorage (max 3)
  const [recentFolders, setRecentFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('github_pusher_recents');
      return saved ? JSON.parse(saved).slice(0, 3) : [];
    } catch {
      return [];
    }
  });

  // Global drag state to allow switching folders from any screen
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Generate default commit message with current date and time
  const generateDefaultCommitMessage = useCallback(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formattedTime = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    setCommitMessage(`Update: ${formattedDate} ${formattedTime}`);
  }, []);

  // Handle folder scan
  const handleFolderSelected = useCallback(async (folderPath: string) => {
    if (!window.electronAPI) return;

    setLastPushResult(null);

    try {
      const status = await window.electronAPI.scanRepo(folderPath);
      setRepoStatus(status);
      setBranch(status.currentBranch || 'main');
      if (status.remoteUrl) {
        setRemoteUrl(status.remoteUrl);
      } else {
        setRemoteUrl('');
      }

      // Save to recent folders (max 3)
      setRecentFolders((prev) => {
        const updated = [folderPath, ...prev.filter((p) => p !== folderPath)].slice(0, 3);
        try {
          localStorage.setItem('github_pusher_recents', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // Initialize release options if exe binaries are detected
      if (status.releaseBinaries && status.releaseBinaries.length > 0) {
        setReleaseOptions({
          enabled: true,
          tagName: 'v1.0.0',
          releaseTitle: `${status.folderName} v1.0.0`,
          selectedBinaryPaths: status.releaseBinaries.map((b) => b.fullPath),
        });
      } else {
        setReleaseOptions({
          enabled: false,
          tagName: 'v1.0.0',
          releaseTitle: 'Release v1.0.0',
          selectedBinaryPaths: [],
        });
      }

      // Show Account Selector modal
      setIsAccountSelectorOpen(true);
    } catch (error) {
      console.error('Failed to scan folder:', error);
    }
  }, []);

  // Open native folder picker from anywhere
  const handleOpenFolderDialog = useCallback(async () => {
    if (window.electronAPI) {
      const selected = await window.electronAPI.selectFolder();
      if (selected) {
        handleFolderSelected(selected);
      }
    }
  }, [handleFolderSelected]);

  // Global drag & drop and accounts initialization
  useEffect(() => {
    generateDefaultCommitMessage();

    // Global drag & drop listeners so user can drop new folders at any time
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsGlobalDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsGlobalDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsGlobalDragging(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        let folderPath = '';
        if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
          folderPath = window.electronAPI.getPathForFile(file);
        }
        if (!folderPath) {
          folderPath = (file as unknown as { path?: string }).path || '';
        }
        if (folderPath) {
          handleFolderSelected(folderPath);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    if (window.electronAPI) {
      window.electronAPI.getAccounts().then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      });

      const unsubscribe = window.electronAPI.onPushLog((log) => {
        setPushLogs((prev) => [...prev, log]);
      });

      return () => {
        window.removeEventListener('dragenter', handleDragEnter);
        window.removeEventListener('dragover', handleDragOver);
        window.removeEventListener('dragleave', handleDragLeave);
        window.removeEventListener('drop', handleWindowDrop);
        unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [generateDefaultCommitMessage, handleFolderSelected]);

  const handleRescan = async () => {
    if (repoStatus && window.electronAPI) {
      const status = await window.electronAPI.scanRepo(repoStatus.path);
      setRepoStatus(status);
    }
  };

  // Account handlers
  const handleSaveAccount = async (account: GitHubAccount) => {
    if (window.electronAPI) {
      const updated = await window.electronAPI.saveAccount(account);
      setAccounts(updated);
      setSelectedAccountId(account.id);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.electronAPI) {
      const updated = await window.electronAPI.deleteAccount(id);
      setAccounts(updated);
      if (selectedAccountId === id) {
        setSelectedAccountId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  // Exclusion handlers
  const handleToggleFileExclusion = (filePath: string) => {
    if (!repoStatus) return;
    const updatedFiles: ChangedFile[] = repoStatus.changedFiles.map((file) => {
      if (file.path === filePath) {
        return { ...file, isExcluded: !file.isExcluded };
      }
      return file;
    });

    setRepoStatus({
      ...repoStatus,
      changedFiles: updatedFiles,
    });
  };

  const handleAddPresetPatterns = (patterns: string[]) => {
    setExcludedPatterns((prev) => Array.from(new Set([...prev, ...patterns])));

    if (repoStatus) {
      // Mark matching files as excluded
      const updatedFiles: ChangedFile[] = repoStatus.changedFiles.map((file) => {
        const matches = patterns.some((p) => {
          const cleanP = p.replace(/\*|\/$/g, '');
          return file.path.includes(cleanP);
        });
        return matches ? { ...file, isExcluded: true } : file;
      });

      setRepoStatus({
        ...repoStatus,
        changedFiles: updatedFiles,
      });
    }
  };

  const handleSaveGitignore = async () => {
    if (!repoStatus || !window.electronAPI) return;
    const allExclusions = [
      ...excludedPatterns,
      ...repoStatus.changedFiles.filter((f) => f.isExcluded).map((f) => f.path),
    ];
    await window.electronAPI.updateGitignore(repoStatus.path, allExclusions);
  };

  // Push execution
  const handleExecutePush = async () => {
    if (!repoStatus || !selectedAccountId || !remoteUrl.trim() || !window.electronAPI) {
      return;
    }

    setIsPushing(true);
    setPushLogs([]);

    const allExcluded = [
      ...excludedPatterns,
      ...repoStatus.changedFiles.filter((f) => f.isExcluded).map((f) => f.path),
    ];

    try {
      const result = await window.electronAPI.executePush({
        repoPath: repoStatus.path,
        accountId: selectedAccountId,
        remoteUrl: remoteUrl.trim(),
        branch: branch.trim() || 'main',
        commitMessage: commitMessage.trim() || 'Update repository',
        excludedPaths: allExcluded,
        autoInit,
        forcePush,
        pullBeforePush,
        releaseOptions: repoStatus.releaseBinaries?.length > 0 ? releaseOptions : undefined,
      });

      setLastPushResult(result);

      if (result.success) {
        // Desktop OS Notification
        if (window.electronAPI && typeof window.electronAPI.notify === 'function') {
          const notifyMsg = result.releaseUrl
            ? `プッシュ＆Release配信 (${repoStatus.folderName}) が完了しました！`
            : `プッシュ (${repoStatus.folderName}) が完了しました！`;
          window.electronAPI.notify('GithubPusher', notifyMsg);
        }

        // Rescan repository on success
        setTimeout(() => {
          handleRescan();
        }, 1500);
      }
    } catch (error) {
      console.error('Push error:', error);
    } finally {
      setIsPushing(false);
    }
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || null;
  const canPush = Boolean(repoStatus && selectedAccountId && remoteUrl.trim() && commitMessage.trim());

  return (
    <div className="relative flex flex-col h-screen w-screen cyber-corridor-bg text-foreground-primary overflow-hidden">
      {/* Titlebar / Header */}
      <Header
        currentAccount={currentAccount}
        hasSelectedFolder={Boolean(repoStatus)}
        onOpenAccountSelector={() => setIsAccountSelectorOpen(true)}
        onOpenAccountManager={() => setIsAccountManagerOpen(true)}
        onClearFolder={() => setRepoStatus(null)}
        onOpenFolderDialog={handleOpenFolderDialog}
      />

      {/* Global Drag & Drop Overlay (can drop from anywhere to switch project) */}
      {isGlobalDragging && (
        <div className="absolute inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 border-4 border-dashed border-neon_cyan-500 pointer-events-none shadow-neon-cyan-strong">
          <div className="w-20 h-20 rounded-2xl bg-[#070e1e] border-2 border-neon_cyan-500 flex items-center justify-center text-neon_cyan-400 shadow-neon-cyan mb-4 animate-bounce">
            <FolderUp className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-foreground-primary neon-glow-cyan mb-1 font-mono">
            ここにドロップしてプロジェクトを切り替え
          </h2>
          <p className="text-xs text-foreground-secondary font-mono">
            どの画面からでも新しいフォルダを放り込むだけで瞬時に解析・切り替わります
          </p>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
        {!repoStatus ? (
          <div className="max-w-3xl w-full mx-auto">
            <DropZone
              onFolderSelected={handleFolderSelected}
              recentFolders={recentFolders}
            />
          </div>
        ) : (
          <div className="max-w-5xl w-full mx-auto space-y-3.5 pb-2">
            {/* Top: Repo Config & Branch */}
            <RepoConfigPanel
              repoStatus={repoStatus}
              remoteUrl={remoteUrl}
              branch={branch}
              autoInit={autoInit}
              forcePush={forcePush}
              pullBeforePush={pullBeforePush}
              onRemoteUrlChange={setRemoteUrl}
              onBranchChange={setBranch}
              onAutoInitChange={setAutoInit}
              onForcePushChange={setForcePush}
              onPullBeforePushChange={setPullBeforePush}
              onChangeFolder={() => setRepoStatus(null)}
              onRescan={handleRescan}
            />

            {/* Middle: Exclusion & File Management */}
            <ExclusionManager
              files={repoStatus.changedFiles}
              excludedPatterns={excludedPatterns}
              hasSensitiveFiles={repoStatus.hasSensitiveFiles}
              sensitiveFiles={repoStatus.sensitiveFiles}
              onToggleFileExclusion={handleToggleFileExclusion}
              onAddPresetPatterns={handleAddPresetPatterns}
              onSaveGitignore={handleSaveGitignore}
            />

            {/* Optional: GitHub Releases Binary Publish Panel (only shown when .exe is detected) */}
            {repoStatus.releaseBinaries && repoStatus.releaseBinaries.length > 0 && (
              <ReleaseConfigPanel
                binaries={repoStatus.releaseBinaries}
                options={releaseOptions}
                onChangeOptions={setReleaseOptions}
              />
            )}

            {/* Bottom: Commit Message, Push & Real-time Console */}
            <CommitAndPushPanel
              commitMessage={commitMessage}
              isPushing={isPushing}
              pushLogs={pushLogs}
              canPush={canPush}
              lastPushResult={lastPushResult}
              onCommitMessageChange={setCommitMessage}
              onExecutePush={handleExecutePush}
              onGenerateDefaultMessage={generateDefaultCommitMessage}
            />
          </div>
        )}
      </main>

      {/* Account Selector Modal (reproducing uploaded UI) */}
      <AccountSelectorModal
        isOpen={isAccountSelectorOpen}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={(id) => setSelectedAccountId(id)}
        onClose={() => setIsAccountSelectorOpen(false)}
        onAddNewAccount={() => setIsAccountManagerOpen(true)}
      />

      {/* Account Manager Modal */}
      <AccountManagerModal
        isOpen={isAccountManagerOpen}
        accounts={accounts}
        onSaveAccount={handleSaveAccount}
        onDeleteAccount={handleDeleteAccount}
        onClose={() => setIsAccountManagerOpen(false)}
      />
    </div>
  );
};
