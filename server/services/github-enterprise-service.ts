import { Octokit } from "@octokit/rest";
import { GitService } from './git-service';
import { LLMService } from './llm-service';

export interface GitHubEnterpriseConfig {
  baseUrl: string; // GitHub Enterprise server URL
  token: string;   // Personal Access Token or GitHub App token
  org?: string;    // Organization name
  team?: string;   // Team name for access control
}

export interface RepositoryConfig {
  name: string;
  description?: string;
  private: boolean;
  autoInit: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
  allowSquashMerge?: boolean;
  allowMergeCommit?: boolean;
  allowRebaseMerge?: boolean;
  deleteBranchOnMerge?: boolean;
}

export interface PullRequestConfig {
  title: string;
  body: string;
  head: string; // branch name
  base: string; // target branch
  draft?: boolean;
  maintainerCanModify?: boolean;
}

export class GitHubEnterpriseService {
  private octokit: Octokit;
  private gitService: GitService;
  private llmService: LLMService;
  private config: GitHubEnterpriseConfig;

  constructor(config: GitHubEnterpriseConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: config.baseUrl.endsWith('/api/v3') ? config.baseUrl : `${config.baseUrl}/api/v3`,
    });
    this.gitService = new GitService();
    this.llmService = new LLMService();
  }

  // Repository Management
  async createRepository(repoConfig: RepositoryConfig, ownerOrOrg?: string): Promise<any> {
    try {
      const owner = ownerOrOrg || this.config.org;
      
      if (owner && owner !== await this.getCurrentUser().then(u => u.login)) {
        // Create in organization
        return await this.octokit.repos.createInOrg({
          org: owner,
          ...repoConfig,
        });
      } else {
        // Create in user account
        return await this.octokit.repos.createForAuthenticatedUser(repoConfig);
      }
    } catch (error) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  async getRepository(owner: string, repo: string): Promise<any> {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }

  async listRepositories(org?: string): Promise<any[]> {
    try {
      if (org || this.config.org) {
        const { data } = await this.octokit.repos.listForOrg({
          org: org || this.config.org!,
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
        });
        return data;
      } else {
        const { data } = await this.octokit.repos.listForAuthenticatedUser({
          type: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
        });
        return data;
      }
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  }

  // Branch Management
  async createBranch(owner: string, repo: string, branchName: string, fromBranch: string = 'main'): Promise<any> {
    try {
      // Get the SHA of the source branch
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`,
      });

      // Create new branch
      return await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  async listBranches(owner: string, repo: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list branches: ${error.message}`);
    }
  }

  async protectBranch(owner: string, repo: string, branch: string, protection: any): Promise<any> {
    try {
      return await this.octokit.repos.updateBranchProtection({
        owner,
        repo,
        branch,
        required_status_checks: {
          strict: true,
          contexts: protection.requiredChecks || [],
        },
        enforce_admins: protection.enforceAdmins || false,
        required_pull_request_reviews: {
          required_approving_review_count: protection.requiredReviewers || 1,
          dismiss_stale_reviews: protection.dismissStaleReviews || true,
          require_code_owner_reviews: protection.requireCodeOwnerReviews || true,
          restrict_pushes_to_specific_actors: protection.restrictPushes || false,
        },
        restrictions: protection.restrictions || null,
      });
    } catch (error) {
      throw new Error(`Failed to protect branch: ${error.message}`);
    }
  }

  // Pull Request Management
  async createPullRequest(owner: string, repo: string, prConfig: PullRequestConfig): Promise<any> {
    try {
      return await this.octokit.pulls.create({
        owner,
        repo,
        ...prConfig,
      });
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async listPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<any[]> {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list pull requests: ${error.message}`);
    }
  }

  async mergePullRequest(owner: string, repo: string, pullNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'): Promise<any> {
    try {
      return await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number: pullNumber,
        merge_method: mergeMethod,
      });
    } catch (error) {
      throw new Error(`Failed to merge pull request: ${error.message}`);
    }
  }

  // File Operations
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
    sha?: string
  ): Promise<any> {
    try {
      const contentEncoded = Buffer.from(content).toString('base64');
      
      return await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: contentEncoded,
        branch,
        sha,
      });
    } catch (error) {
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString();
      } else {
        throw new Error('File not found or is a directory');
      }
    } catch (error) {
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  async deleteFile(owner: string, repo: string, path: string, message: string, sha: string, branch?: string): Promise<any> {
    try {
      return await this.octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha,
        branch,
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Webhook Management
  async createWebhook(owner: string, repo: string, webhookUrl: string, events: string[] = ['push', 'pull_request']): Promise<any> {
    try {
      return await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
        events,
        active: true,
      });
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  async listWebhooks(owner: string, repo: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.repos.listWebhooks({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list webhooks: ${error.message}`);
    }
  }

  // Actions and Workflows
  async listWorkflowRuns(owner: string, repo: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 100,
      });
      return data.workflow_runs;
    } catch (error) {
      throw new Error(`Failed to list workflow runs: ${error.message}`);
    }
  }

  async getWorkflowRun(owner: string, repo: string, runId: number): Promise<any> {
    try {
      const { data } = await this.octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get workflow run: ${error.message}`);
    }
  }

  async rerunWorkflow(owner: string, repo: string, runId: number): Promise<any> {
    try {
      return await this.octokit.actions.reRunWorkflow({
        owner,
        repo,
        run_id: runId,
      });
    } catch (error) {
      throw new Error(`Failed to rerun workflow: ${error.message}`);
    }
  }

  // Team and Organization Management
  async listTeams(org?: string): Promise<any[]> {
    try {
      const orgName = org || this.config.org;
      if (!orgName) {
        throw new Error('Organization name is required');
      }

      const { data } = await this.octokit.teams.list({
        org: orgName,
        per_page: 100,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list teams: ${error.message}`);
    }
  }

  async addTeamToRepository(teamSlug: string, owner: string, repo: string, permission: 'pull' | 'push' | 'admin' = 'push'): Promise<any> {
    try {
      const orgName = this.config.org;
      if (!orgName) {
        throw new Error('Organization name is required');
      }

      return await this.octokit.teams.addOrUpdateRepoPermissionsInOrg({
        org: orgName,
        team_slug: teamSlug,
        owner,
        repo,
        permission,
      });
    } catch (error) {
      throw new Error(`Failed to add team to repository: ${error.message}`);
    }
  }

  // User Management
  async getCurrentUser(): Promise<any> {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }

  async getUser(username: string): Promise<any> {
    try {
      const { data } = await this.octokit.users.getByUsername({
        username,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Project Setup with AI Enhancement
  async setupProjectWithAI(
    projectName: string,
    projectType: string,
    features: string[],
    owner?: string
  ): Promise<{
    repository: any;
    initialCommit: any;
    defaultBranch: string;
    protectedBranches: string[];
  }> {
    try {
      // Create repository
      const repository = await this.createRepository({
        name: projectName,
        description: `AI-generated ${projectType} project with automated setup`,
        private: true,
        autoInit: true,
        gitignoreTemplate: this.getGitIgnoreTemplate(projectType),
        allowSquashMerge: true,
        allowMergeCommit: false,
        allowRebaseMerge: true,
        deleteBranchOnMerge: true,
      }, owner);

      // Generate and commit project structure using AI
      const projectStructure = await this.llmService.generateProjectStructure(projectType, { features });
      
      // Create initial project files
      for (const file of projectStructure.files) {
        const content = await this.llmService.generateFileContent(file.path, file.type, projectType, { features });
        await this.createOrUpdateFile(
          repository.owner.login,
          repository.name,
          file.path,
          content,
          `feat: add ${file.path} - AI generated`,
          'main'
        );
      }

      // Set up branch protection
      await this.protectBranch(repository.owner.login, repository.name, 'main', {
        requiredChecks: ['ci/tests', 'ci/lint'],
        requiredReviewers: 1,
        dismissStaleReviews: true,
        requireCodeOwnerReviews: true,
        enforceAdmins: false,
      });

      // Create development branch
      await this.createBranch(repository.owner.login, repository.name, 'develop', 'main');

      return {
        repository,
        initialCommit: 'AI-generated project structure',
        defaultBranch: 'main',
        protectedBranches: ['main'],
      };
    } catch (error) {
      throw new Error(`Failed to setup project with AI: ${error.message}`);
    }
  }

  // Migration helpers
  async migrateFromOtherSCM(
    sourceUrl: string,
    projectName: string,
    migrationStrategy: 'full-history' | 'squash' | 'fresh-start' = 'full-history'
  ): Promise<any> {
    try {
      // Create new repository
      const repository = await this.createRepository({
        name: projectName,
        description: `Migrated project from ${sourceUrl}`,
        private: true,
        autoInit: false,
      });

      // Set up webhook for continuous sync during migration
      await this.createWebhook(
        repository.owner.login,
        repository.name,
        `${process.env.WEBHOOK_BASE_URL}/migration/${repository.id}`,
        ['push', 'pull_request', 'issues']
      );

      return {
        repository,
        migrationStrategy,
        webhookConfigured: true,
      };
    } catch (error) {
      throw new Error(`Failed to migrate from other SCM: ${error.message}`);
    }
  }

  private getGitIgnoreTemplate(projectType: string): string {
    const templates: { [key: string]: string } = {
      'node.js': 'Node',
      'python': 'Python',
      'java': 'Java',
      'go': 'Go',
      'rust': 'Rust',
      'flutter': 'Dart',
      'react': 'Node',
      'vue': 'Node',
      'angular': 'Node',
    };

    return templates[projectType.toLowerCase()] || 'Node';
  }

  // Advanced features
  async analyzeRepositoryHealth(owner: string, repo: string): Promise<{
    score: number;
    recommendations: string[];
    metrics: any;
  }> {
    try {
      const repository = await this.getRepository(owner, repo);
      const branches = await this.listBranches(owner, repo);
      const pullRequests = await this.listPullRequests(owner, repo, 'all');
      const workflows = await this.listWorkflowRuns(owner, repo);

      const healthMetrics = {
        hasReadme: repository.has_readme,
        hasLicense: repository.license !== null,
        hasDescription: repository.description !== null && repository.description.length > 0,
        branchProtection: branches.some(b => b.protected),
        recentActivity: new Date(repository.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ciSetup: workflows.length > 0,
        activeContributors: pullRequests.length > 0,
      };

      const score = Object.values(healthMetrics).filter(Boolean).length / Object.keys(healthMetrics).length * 100;

      const recommendations = [];
      if (!healthMetrics.hasReadme) recommendations.push('Add a comprehensive README.md');
      if (!healthMetrics.hasLicense) recommendations.push('Add an appropriate license');
      if (!healthMetrics.hasDescription) recommendations.push('Add a detailed repository description');
      if (!healthMetrics.branchProtection) recommendations.push('Enable branch protection on main branches');
      if (!healthMetrics.ciSetup) recommendations.push('Set up continuous integration workflows');

      return {
        score: Math.round(score),
        recommendations,
        metrics: healthMetrics,
      };
    } catch (error) {
      throw new Error(`Failed to analyze repository health: ${error.message}`);
    }
  }
}