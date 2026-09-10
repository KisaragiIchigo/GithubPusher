import fs from 'node:fs';
import path from 'node:path';
import simpleGit, { SimpleGit } from 'simple-git';
import type { RepoStatus, ChangedFile, PushOptions, PushLog, GitHubAccount, FileStatusType, ReleaseBinary, GitCommit, PushResult } from '../src/types';
import { executeReleasePublish } from './github-release-service';

const SENSITIVE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
  /secret/i,
];

function isPathSensitive(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fileName));
}

const DEFAULT_EXCLUDE_PATTERNS = [
  // Windows OS / System files
  'desktop.ini',
  'Thumbs.db',
  'ehthumbs.db',
  'IconCache.db',
  '$RECYCLE.BIN',
  // macOS files
  '.DS_Store',
  '._*',
  // Temp & Logs
  '*.tmp',
  '*.temp',
  '*.log',
  '*.bak',
  '*.swp',
  // AI Work files
  'changelogs.json',
  'project_style.json',
  'implementation_plan.md',
  'walkthrough.md',
  '.gemini',
  // Common Heavy Dev Artifacts
  'node_modules',
  'dist',
  'build',
  'Release',
  'release',
  '*.exe',
  '.env',
  '.env.*',
  '__pycache__',
  '.venv',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function findReleaseBinaries(folderPath: string): ReleaseBinary[] {
  const binaries: ReleaseBinary[] = [];

  // Candidate release directories commonly used in C#, C++, Rust, Electron etc.
  const candidateDirs = [
    path.join(folderPath, 'Release'),
    path.join(folderPath, 'release'),
    path.join(folderPath, 'release-build'),
    path.join(folderPath, 'releases'),
    path.join(folderPath, 'bin', 'Release'),
    path.join(folderPath, 'bin', 'x64', 'Release'),
    path.join(folderPath, 'bin', 'x86', 'Release'),
    path.join(folderPath, 'bin', 'ARM64', 'Release'),
    path.join(folderPath, 'out'),
    path.join(folderPath, 'build'),
    path.join(folderPath, 'dist'),
  ];

  const checkedDirs = new Set<string>();

  for (const dir of candidateDirs) {
    const lower = dir.toLowerCase();
    if (fs.existsSync(dir) && !checkedDirs.has(lower)) {
      checkedDirs.add(lower);
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.toLowerCase().endsWith('.exe')) {
            if (file.toLowerCase() === 'elevate.exe') continue;
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
              binaries.push({
                name: file,
                fullPath,
                relativePath: path.relative(folderPath, fullPath).replace(/\\/g, '/'),
                sizeBytes: stat.size,
                sizeFormatted: formatBytes(stat.size),
              });
            }
          }
        }
      } catch (err) {
        console.error('Error reading candidate release dir:', dir, err);
      }
    }
  }

  // Also check project root for any direct .exe if no release folder binary was found
  if (binaries.length === 0) {
    try {
      const rootFiles = fs.readdirSync(folderPath);
      for (const file of rootFiles) {
        if (file.toLowerCase().endsWith('.exe')) {
          const fullPath = path.join(folderPath, file);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            binaries.push({
              name: file,
              fullPath,
              relativePath: file,
              sizeBytes: stat.size,
              sizeFormatted: formatBytes(stat.size),
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return binaries;
}

function isDefaultExcluded(filePath: string): boolean {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  // Instant match for common Windows/OS artifacts
  if (
    base === 'desktop.ini' ||
    base === 'thumbs.db' ||
    base === '.ds_store' ||
    base.endsWith('.tmp') ||
    base.endsWith('.log') ||
    base.endsWith('.bak')
  ) {
    return true;
  }

  return DEFAULT_EXCLUDE_PATTERNS.some((pattern) => {
    const pat = pattern.toLowerCase();
    if (pat.startsWith('*.')) {
      const ext = pat.slice(1);
      return base.endsWith(ext);
    }
    return base === pat || norm.startsWith(pat) || norm.includes(`/${pat}`) || norm.includes(pat);
  });
}

function parseGitStatus(statusChar: string): FileStatusType {
  switch (statusChar) {
    case 'M':
      return 'modified';
    case 'A':
      return 'added';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case '?':
    default:
      return 'untracked';
  }
}

export async function scanRepository(folderPath: string): Promise<RepoStatus> {
  const folderName = path.basename(folderPath);
  const gitDir = path.join(folderPath, '.git');
  const isGitRepo = fs.existsSync(gitDir);

  if (!isGitRepo) {
    // Collect immediate top files/folders to preview what will be added
    const changedFiles: ChangedFile[] = [];
    const sensitiveFiles: string[] = [];

    try {
      const items = fs.readdirSync(folderPath);
      for (const item of items) {
        if (item === '.git') continue;
        const sensitive = isPathSensitive(item);
        if (sensitive) {
          sensitiveFiles.push(item);
        }
        changedFiles.push({
          path: item,
          status: 'untracked',
          isExcluded: isDefaultExcluded(item),
          isSensitive: sensitive,
        });
      }
    } catch (err) {
      console.error('Error scanning folder:', err);
    }

    return {
      path: folderPath,
      folderName,
      isGitRepo: false,
      currentBranch: 'main',
      remoteUrl: '',
      changedFiles,
      hasSensitiveFiles: sensitiveFiles.length > 0,
      sensitiveFiles,
      releaseBinaries: findReleaseBinaries(folderPath),
      recentCommits: [],
    };
  }

  const git: SimpleGit = simpleGit(folderPath);

  let currentBranch = 'main';
  try {
    const branchSummary = await git.branchLocal();
    currentBranch = branchSummary.current || 'main';
  } catch {
    // Default fallback
  }

  let remoteUrl = '';
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin') || remotes[0];
    if (origin && origin.refs.push) {
      remoteUrl = origin.refs.push;
    }
  } catch {
    // No remote
  }

  const changedFiles: ChangedFile[] = [];
  const sensitiveFiles: string[] = [];

  try {
    const status = await git.status();

    for (const file of status.files) {
      const sensitive = isPathSensitive(file.path);
      if (sensitive) {
        sensitiveFiles.push(file.path);
      }
      changedFiles.push({
        path: file.path,
        status: parseGitStatus(file.working_dir || file.index),
        isExcluded: isDefaultExcluded(file.path),
        isSensitive: sensitive,
      });
    }
  } catch (err) {
    console.error('Error reading git status:', err);
  }

  let recentCommits: GitCommit[] = [];
  try {
    const logSummary = await git.log({ maxCount: 5 });
    recentCommits = logSummary.all.map((c) => ({
      hash: c.hash.substring(0, 7),
      date: new Date(c.date).toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      message: c.message,
      author_name: c.author_name,
    }));
  } catch {
    // Initial branch with no commits
  }

  return {
    path: folderPath,
    folderName,
    isGitRepo: true,
    currentBranch,
    remoteUrl,
    changedFiles,
    hasSensitiveFiles: sensitiveFiles.length > 0,
    sensitiveFiles,
    releaseBinaries: findReleaseBinaries(folderPath),
    recentCommits,
  };
}

export async function updateGitignore(folderPath: string, patterns: string[]): Promise<boolean> {
  const gitignorePath = path.join(folderPath, '.gitignore');
  let existingContent = '';
  if (fs.existsSync(gitignorePath)) {
    existingContent = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const lines = new Set(existingContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
  for (const pattern of patterns) {
    lines.add(pattern.trim());
  }

  const newContent = Array.from(lines).join('\n') + '\n';
  fs.writeFileSync(gitignorePath, newContent, 'utf-8');
  return true;
}

export async function executePushPipeline(
  options: PushOptions,
  account: GitHubAccount,
  sendLog: (log: PushLog) => void
): Promise<PushResult> {
  const { repoPath, remoteUrl, branch, commitMessage, excludedPaths, autoInit } = options;
  const git: SimpleGit = simpleGit(repoPath);

  const postLog = (type: PushLog['type'], message: string) => {
    sendLog({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour12: false }),
      type,
      message,
    });
  };

  try {
    postLog('step', 'リポジトリの初期化状態を確認中...');
    const isGit = fs.existsSync(path.join(repoPath, '.git'));

    if (!isGit) {
      if (!autoInit) {
        throw new Error('Gitリポジトリが初期化されていません。');
      }
      postLog('info', 'Gitリポジトリを新規初期化しています (git init)...');
      await git.init();
      await git.checkoutLocalBranch(branch || 'main');
      postLog('success', `Gitリポジトリを初期化しました (ブランチ: ${branch || 'main'})`);
    }

    // Configure user name and email locally for this repository
    postLog('info', `コミットユーザーを設定中: ${account.displayName || account.username} <${account.email}>`);
    await git.addConfig('user.name', account.displayName || account.username, false, 'local');
    await git.addConfig('user.email', account.email, false, 'local');

    // Update .gitignore if exclusions were specified (always include default AI files)
    const allToExclude = Array.from(new Set([...DEFAULT_EXCLUDE_PATTERNS, ...excludedPaths]));
    if (allToExclude.length > 0) {
      postLog('info', `除外ルール（${allToExclude.length}件、AI管理ファイル含む）を .gitignore に反映中...`);
      await updateGitignore(repoPath, allToExclude);
      postLog('success', '.gitignore を更新しました');
    }

    // Stage files
    postLog('step', '変更ファイルをステージング中 (git add .)...');
    await git.add('.');

    // Ensure excluded files are not staged even if they were previously tracked
    for (const ex of allToExclude) {
      try {
        await git.reset(['HEAD', '--', ex]);
      } catch {
        // ignore if not staged
      }
    }
    postLog('success', 'ステージングが完了しました');

    // Check status before commit
    const status = await git.status();
    if (status.staged.length === 0 && status.created.length === 0 && status.modified.length === 0) {
      postLog('warning', 'コミット対象の変更がありません（既に最新状態です）');
    } else {
      postLog('step', `コミット作成中: "${commitMessage}"...`);
      await git.commit(commitMessage);
      postLog('success', 'コミットが完了しました');
    }

    // Set Remote Origin
    postLog('step', `リモートリポジトリの設定を確認中 (${remoteUrl})...`);
    const remotes = await git.getRemotes();
    const hasOrigin = remotes.some((r) => r.name === 'origin');

    // Build authenticated URL: https://<username>:<token>@github.com/<owner>/<repo>.git
    let authUrl = remoteUrl.trim();
    if (authUrl.startsWith('https://')) {
      const cleanUrl = authUrl.replace(/^https:\/\/[^@]+@/, 'https://');
      const urlWithoutHttps = cleanUrl.replace('https://', '');
      authUrl = `https://${encodeURIComponent(account.username)}:${encodeURIComponent(account.token)}@${urlWithoutHttps}`;
    }

    if (hasOrigin) {
      await git.remote(['set-url', 'origin', authUrl]);
    } else {
      await git.addRemote('origin', authUrl);
    }

    const { forcePush, pullBeforePush } = options;

    // Optional pull before push if specified
    if (pullBeforePush) {
      postLog('step', `リモート (${branch}) の既存ファイルを取り込んでいます...`);
      try {
        await git.pull('origin', branch, { '--allow-unrelated-histories': null, '--no-rebase': null });
        postLog('success', 'リモートの既存コミットを取り込みました');
      } catch (pullErr: unknown) {
        const pullMsg = pullErr instanceof Error ? pullErr.message : String(pullErr);
        postLog('warning', `リモート取り込みの注意: ${pullMsg}`);
      }
    }

    // Push execution with auto-recovery for remote commits (LICENSE, README etc.)
    postLog('step', `GitHub (${account.username}) へプッシュを実行中 (ブランチ: ${branch})...`);
    const pushFlags = ['--set-upstream'];
    if (forcePush) {
      pushFlags.push('--force');
      postLog('warning', '強制プッシュ (--force) を適用します');
    }

    try {
      await git.push('origin', branch, pushFlags);
      postLog('success', `プッシュが正常に完了しました！ (origin/${branch})`);
    } catch (pushError: unknown) {
      const errMsg = pushError instanceof Error ? pushError.message : String(pushError);

      // Check if rejected due to existing remote commits (e.g. LICENSE / README created on GitHub)
      if (
        !forcePush &&
        (errMsg.includes('fetch first') ||
          errMsg.includes('rejected') ||
          errMsg.includes('non-fast-forward') ||
          errMsg.includes('remote contains work'))
      ) {
        postLog('warning', 'リモートに既存のコミット（LICENSE / README 等）を検知しました。');
        postLog('step', 'リモートの履歴を統合して再プッシュを自動試行しています (--allow-unrelated-histories)...');

        try {
          await git.pull('origin', branch, { '--allow-unrelated-histories': null, '--no-rebase': null });
          postLog('success', 'リモートのファイル（LICENSE等）をローカルに自動統合しました');
          postLog('step', '統合コミットをプッシュ中...');
          await git.push('origin', branch, ['--set-upstream']);
          postLog('success', `プッシュが正常に完了しました！ (origin/${branch})`);
        } catch (mergeError: unknown) {
          const mergeMsg = mergeError instanceof Error ? mergeError.message : String(mergeError);
          throw new Error(
            `リモートに既存ファイル（LICENSEやREADME等）が存在します。上書きする場合は「強制プッシュ (--force)」を有効にして再実行してください。(詳細: ${mergeMsg})`
          );
        }
      } else {
        throw pushError;
      }
    } finally {
      // Clean up remote URL to not leave PAT in plain text in .git/config
      const cleanRemoteUrl = remoteUrl.trim().replace(/^https:\/\/[^@]+@/, 'https://');
      await git.remote(['set-url', 'origin', cleanRemoteUrl]).catch(() => {});
      postLog('info', 'リモート設定から一時認証情報を安全に消去しました');
    }

    // Parse web URL for GitHub repository
    let webRepoUrl: string | undefined;
    const cleanRepoMatch = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)(\.git)?$/i);
    if (cleanRepoMatch) {
      webRepoUrl = `https://github.com/${cleanRepoMatch[1]}/${cleanRepoMatch[2]}`;
    }

    let publishedReleaseUrl: string | undefined;

    // Execute GitHub Releases publishing if enabled and binaries are selected
    if (
      options.releaseOptions &&
      options.releaseOptions.enabled &&
      options.releaseOptions.selectedBinaryPaths.length > 0
    ) {
      postLog('step', 'GitHub Releases へのバイナリアセット配信を開始します...');
      const releaseResult = await executeReleasePublish(
        remoteUrl,
        branch,
        options.releaseOptions,
        account,
        sendLog
      );
      if (releaseResult.success && releaseResult.releaseUrl) {
        publishedReleaseUrl = releaseResult.releaseUrl;
      } else if (!releaseResult.success) {
        postLog('warning', `GitHub Releases 配信で注意: ${releaseResult.message}`);
      }
    }

    return {
      success: true,
      message: 'GitHubへのプッシュが正常に完了しました。',
      repoUrl: webRepoUrl,
      releaseUrl: publishedReleaseUrl,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    postLog('error', `エラーが発生しました: ${errMsg}`);
    return {
      success: false,
      message: errMsg,
    };
  }
}
