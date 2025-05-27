import { CodeGeneratorAgent } from './code-generator-agent';
import { InfrastructureAgent } from './infrastructure-agent';
import { LearningAgent } from './learning-agent';
import { storage } from '../storage';
import type { Agent } from '@shared/schema';

export class AgentManager {
  private agents: Map<number, any> = new Map();
  private static instance: AgentManager;

  private constructor() {}

  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async initializeAgents(): Promise<void> {
    // Create default agents if they don't exist
    const existingAgents = await storage.getAgents();
    
    if (existingAgents.length === 0) {
      // Create default agents
      const codeAgent = await storage.createAgent({
        name: 'Code Generator Agent',
        type: 'code_generator',
        config: {
          maxConcurrentTasks: 3,
          supportedLanguages: ['python', 'javascript', 'typescript', 'java', 'go']
        }
      });

      const infraAgent = await storage.createAgent({
        name: 'Infrastructure Agent',
        type: 'infrastructure',
        config: {
          supportedProviders: ['aws', 'gcp', 'azure'],
          autoValidate: true
        }
      });

      const learningAgent = await storage.createAgent({
        name: 'Learning Agent',
        type: 'learning',
        config: {
          analysisInterval: 3600000, // 1 hour
          maxCommitsPerAnalysis: 50
        }
      });

      await this.startAgent(codeAgent.id);
      await this.startAgent(infraAgent.id);
      await this.startAgent(learningAgent.id);
    } else {
      // Start existing agents
      for (const agent of existingAgents) {
        if (agent.status === 'running') {
          await this.startAgent(agent.id);
        }
      }
    }
  }

  async startAgent(agentId: number): Promise<void> {
    const agentData = await storage.getAgent(agentId);
    if (!agentData) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (this.agents.has(agentId)) {
      return; // Already running
    }

    let agent;
    switch (agentData.type) {
      case 'code_generator':
        agent = new CodeGeneratorAgent(agentId);
        break;
      case 'infrastructure':
        agent = new InfrastructureAgent(agentId);
        break;
      case 'learning':
        agent = new LearningAgent(agentId);
        break;
      default:
        throw new Error(`Unknown agent type: ${agentData.type}`);
    }

    this.agents.set(agentId, agent);
    await agent.start();

    // Set up event listeners
    agent.on('taskError', (task, error) => {
      console.error(`Agent ${agentId} task error:`, error);
    });
  }

  async stopAgent(agentId: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      await agent.stop();
      this.agents.delete(agentId);
    }
  }

  async assignTask(agentType: string, task: any): Promise<void> {
    const agents = await storage.getAgents();
    const targetAgent = agents.find(a => a.type === agentType && a.status === 'running');
    
    if (!targetAgent) {
      throw new Error(`No running agent of type ${agentType} found`);
    }

    const agentInstance = this.agents.get(targetAgent.id);
    if (agentInstance) {
      await agentInstance.addTask(task);
    }
  }

  async getAgentStatus(): Promise<Agent[]> {
    return await storage.getAgents();
  }

  async createProject(projectData: any): Promise<void> {
    const project = await storage.createProject(projectData);
    
    // Assign to code generator agent
    await this.assignTask('code_generator', {
      id: `project_${project.id}_${Date.now()}`,
      type: 'generate_project',
      payload: {
        projectId: project.id,
        projectType: projectData.type,
        name: projectData.name,
        config: projectData.config
      },
      priority: 10
    });

    // If auto-deploy is enabled, also assign to infrastructure agent
    if (projectData.config.autoDeploy) {
      await this.assignTask('infrastructure', {
        id: `infra_${project.id}_${Date.now()}`,
        type: 'generate_terraform',
        payload: {
          projectId: project.id,
          cloudProvider: projectData.config.cloudProvider,
          environment: 'development',
          config: projectData.config
        },
        priority: 8
      });
    }
  }
}
