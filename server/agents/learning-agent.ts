import { BaseAgent, type AgentTask } from './base-agent';
import { GitService } from '../services/git-service';
import { LLMService } from '../services/llm-service';
import { storage } from '../storage';

interface LearningTask {
  projectId: number;
  repositoryPath: string;
  type: 'commit_analysis' | 'pattern_learning' | 'improvement_suggestion';
}

export class LearningAgent extends BaseAgent {
  private gitService: GitService;
  private llmService: LLMService;
  private knowledgeBase: Map<string, any> = new Map();

  constructor(agentId: number) {
    super(agentId);
    this.gitService = new GitService();
    this.llmService = new LLMService();
  }

  protected async executeTask(task: AgentTask): Promise<void> {
    switch (task.type) {
      case 'analyze_commits':
        await this.analyzeCommits(task.payload as LearningTask);
        break;
      case 'learn_patterns':
        await this.learnPatterns(task.payload as LearningTask);
        break;
      case 'suggest_improvements':
        await this.suggestImprovements(task.payload as LearningTask);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async analyzeCommits(task: LearningTask): Promise<void> {
    const { projectId, repositoryPath } = task;
    
    await this.log('info', `Analyzing commits for project ${projectId}`);
    await this.updateProgress(10);

    // Get repository info
    const gitRepo = await storage.getGitRepository(projectId);
    if (!gitRepo) {
      throw new Error(`No git repository found for project ${projectId}`);
    }

    // Get recent commits
    const commits = await this.gitService.getRecentCommits(repositoryPath, 10);
    await this.updateProgress(30);

    // Analyze each commit using LLM
    const commitAnalyses = [];
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const diff = await this.gitService.getCommitDiff(repositoryPath, commit.hash);
      
      const analysis = await this.llmService.analyzeCommit(commit, diff);
      commitAnalyses.push(analysis);
      
      await this.updateProgress(30 + (i / commits.length) * 50);
    }

    // Extract learning insights
    const insights = await this.llmService.extractLearningInsights(commitAnalyses);
    
    // Store in knowledge base
    const projectKey = `project_${projectId}`;
    const existingKnowledge = this.knowledgeBase.get(projectKey) || {};
    this.knowledgeBase.set(projectKey, {
      ...existingKnowledge,
      commitPatterns: insights.patterns,
      codingStyle: insights.style,
      lastAnalyzed: new Date()
    });

    // Update repository last analyzed timestamp
    await storage.updateGitRepository(gitRepo.id, {
      lastAnalyzed: new Date(),
      lastCommit: commits[0]?.hash
    });

    await this.updateProgress(100);
    await this.createActivity(
      'commits_analyzed',
      'Commit analysis completed',
      `Analyzed ${commits.length} commits and extracted ${insights.patterns.length} patterns`,
      projectId
    );
  }

  private async learnPatterns(task: LearningTask): Promise<void> {
    const { projectId } = task;
    
    await this.log('info', `Learning patterns for project ${projectId}`);
    await this.updateProgress(20);

    const projectKey = `project_${projectId}`;
    const knowledge = this.knowledgeBase.get(projectKey);
    
    if (!knowledge || !knowledge.commitPatterns) {
      throw new Error('No commit patterns available for learning');
    }

    // Use LLM to identify meta-patterns and best practices
    const metaPatterns = await this.llmService.identifyMetaPatterns(knowledge.commitPatterns);
    await this.updateProgress(60);

    // Generate improvement recommendations
    const recommendations = await this.llmService.generateRecommendations(metaPatterns);
    await this.updateProgress(80);

    // Update knowledge base
    this.knowledgeBase.set(projectKey, {
      ...knowledge,
      metaPatterns,
      recommendations,
      lastLearning: new Date()
    });

    await this.updateProgress(100);
    await this.createActivity(
      'patterns_learned',
      'Pattern learning completed',
      `Identified ${metaPatterns.length} meta-patterns and ${recommendations.length} recommendations`,
      projectId
    );
  }

  private async suggestImprovements(task: LearningTask): Promise<void> {
    const { projectId } = task;
    
    await this.log('info', `Generating improvement suggestions for project ${projectId}`);
    
    const projectKey = `project_${projectId}`;
    const knowledge = this.knowledgeBase.get(projectKey);
    
    if (!knowledge) {
      throw new Error('No knowledge available for improvement suggestions');
    }

    const suggestions = await this.llmService.generateImprovementSuggestions(knowledge);
    
    await this.createActivity(
      'improvements_suggested',
      'Improvement suggestions generated',
      `Generated ${suggestions.length} suggestions based on learned patterns`,
      projectId
    );
  }

  public getKnowledge(projectId: number): any {
    return this.knowledgeBase.get(`project_${projectId}`);
  }

  public async trainFromExternalCode(codebase: string, metadata: any): Promise<void> {
    await this.log('info', 'Training from external codebase');
    
    const analysis = await this.llmService.analyzeCodebase(codebase, metadata);
    
    // Store global patterns
    const globalKey = 'global_patterns';
    const existingGlobal = this.knowledgeBase.get(globalKey) || { patterns: [] };
    
    this.knowledgeBase.set(globalKey, {
      patterns: [...existingGlobal.patterns, ...analysis.patterns],
      lastUpdated: new Date()
    });
  }
}
