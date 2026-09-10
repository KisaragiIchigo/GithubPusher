export interface GitHubAccount {
  id: string;
  username: string;
  displayName: string;
  email: string;
  token: string;
  avatarUrl?: string;
}

export type FileStatusType = 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';

export interface ChangedFile {
  path: string;
  status: FileStatusType;
  isExcluded: boolean;
  isSensitive: boolean;
}

export interface ReleaseBinary {
  name: string;
  fullPath: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
}

export interface ReleaseOptions {
  enabled: boolean;
  tagName: string;
  releaseTitle: string;
  releaseNotes?: string;
  selectedBinaryPaths: string[];
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
}

export interface RepoStatus {
  path: string;
  folderName: string;
  isGitRepo: boolean;
  currentBranch: string;
  remoteUrl: string;
  changedFiles: ChangedFile[];
  hasSensitiveFiles: boolean;
  sensitiveFiles: string[];
  releaseBinaries: ReleaseBinary[];
  recentCommits: GitCommit[];
}

export interface PushOptions {
  repoPath: string;
  accountId: string;
  remoteUrl: string;
  branch: string;
  commitMessage: string;
  excludedPaths: string[];
  autoInit: boolean;
  forcePush?: boolean;
  pullBeforePush?: boolean;
  releaseOptions?: ReleaseOptions;
}

export interface PushLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'step';
  message: string;
}

export interface PushResult {
  success: boolean;
  message: string;
  repoUrl?: string;
  releaseUrl?: string;
}

export interface ElectronAPI {
  getPathForFile: (file: File) => string;
  scanRepo: (folderPath: string) => Promise<RepoStatus>;
  selectFolder: () => Promise<string | null>;
  getAccounts: () => Promise<GitHubAccount[]>;
  saveAccount: (account: GitHubAccount) => Promise<GitHubAccount[]>;
  deleteAccount: (id: string) => Promise<GitHubAccount[]>;
  executePush: (options: PushOptions) => Promise<PushResult>;
  onPushLog: (callback: (log: PushLog) => void) => () => void;
  updateGitignore: (folderPath: string, patterns: string[]) => Promise<boolean>;
  minimizeWindow: () => void;
  closeWindow: () => void;
  openExternal: (url: string) => Promise<void>;
  notify: (title: string, body: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
