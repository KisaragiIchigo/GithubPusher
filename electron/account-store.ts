import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { GitHubAccount } from '../src/types';

function getStorePath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'accounts.json');
}

export function loadAccounts(): GitHubAccount[] {
  try {
    const storePath = getStorePath();
    if (!fs.existsSync(storePath)) {
      return [];
    }
    const data = fs.readFileSync(storePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load accounts:', error);
    return [];
  }
}

export function saveAccount(account: GitHubAccount): GitHubAccount[] {
  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.id === account.id || a.username.toLowerCase() === account.username.toLowerCase());
  
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...account };
  } else {
    accounts.push(account);
  }

  const storePath = getStorePath();
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(storePath, JSON.stringify(accounts, null, 2), 'utf-8');
  return accounts;
}

export function deleteAccount(id: string): GitHubAccount[] {
  const accounts = loadAccounts().filter((a) => a.id !== id);
  const storePath = getStorePath();
  fs.writeFileSync(storePath, JSON.stringify(accounts, null, 2), 'utf-8');
  return accounts;
}
