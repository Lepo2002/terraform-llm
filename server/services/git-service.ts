import { simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

export class GitService {
  async initRepository(projectPath: string): Promise<void> {
    const git: SimpleGit = simpleGit(projectPath);
    await git.init();
    
    // Create basic .gitignore
    const gitignoreContent = `
node_modules/
__pycache__/
*.pyc
.env
.env.local
dist/
build/
.DS_Store
*.log
`;
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent.trim());
  }

  async addAll(projectPath: string): Promise<void> {
    const git: SimpleGit = simpleGit(projectPath);
    await git.add('.');
  }

  async commit(projectPath: string, message: string): Promise<void> {
    const git: SimpleGit = simpleGit(projectPath);
    await git.commit(message);
  }

  async getRecentCommits(repositoryPath: string, count: number = 10): Promise<any[]> {
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      const log = await git.log({ maxCount: count });
      
      return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        email: commit.author_email,
        date: commit.date
      }));
    } catch (error) {
      console.error('Error getting commits:', error);
      return [];
    }
  }

  async getCommitDiff(repositoryPath: string, commitHash: string): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      const diff = await git.show([commitHash, '--pretty=format:', '--name-status']);
      return diff;
    } catch (error) {
      console.error('Error getting commit diff:', error);
      return '';
    }
  }

  async getBranches(repositoryPath: string): Promise<string[]> {
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      const branches = await git.branchLocal();
      return branches.all;
    } catch (error) {
      console.error('Error getting branches:', error);
      return [];
    }
  }

  async createBranch(repositoryPath: string, branchName: string): Promise<void> {
    const git: SimpleGit = simpleGit(repositoryPath);
    await git.checkoutLocalBranch(branchName);
  }

  async switchBranch(repositoryPath: string, branchName: string): Promise<void> {
    const git: SimpleGit = simpleGit(repositoryPath);
    await git.checkout(branchName);
  }

  async getStatus(repositoryPath: string): Promise<any> {
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      return await git.status();
    } catch (error) {
      console.error('Error getting git status:', error);
      return null;
    }
  }

  async clone(repositoryUrl: string, destinationPath: string): Promise<void> {
    const git: SimpleGit = simpleGit();
    await git.clone(repositoryUrl, destinationPath);
  }

  async pull(repositoryPath: string): Promise<void> {
    const git: SimpleGit = simpleGit(repositoryPath);
    await git.pull();
  }

  async push(repositoryPath: string, remote: string = 'origin', branch: string = 'main'): Promise<void> {
    const git: SimpleGit = simpleGit(repositoryPath);
    await git.push(remote, branch);
  }

  async addRemote(repositoryPath: string, remoteName: string, remoteUrl: string): Promise<void> {
    const git: SimpleGit = simpleGit(repositoryPath);
    await git.addRemote(remoteName, remoteUrl);
  }

  async getRemotes(repositoryPath: string): Promise<string[]> {
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      const remotes = await git.getRemotes();
      return remotes.map(remote => `${remote.name}: ${remote.refs.fetch}`);
    } catch (error) {
      console.error('Error getting remotes:', error);
      return [];
    }
  }
}
