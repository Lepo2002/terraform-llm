import { EventEmitter } from 'events';
import { storage } from '../storage';
import type { Agent } from '@shared/schema';

export interface AgentTask {
  id: string;
  type: string;
  payload: any;
  priority: number;
}

export abstract class BaseAgent extends EventEmitter {
  protected agentId: number;
  protected isRunning: boolean = false;
  protected taskQueue: AgentTask[] = [];
  protected currentTask: AgentTask | null = null;

  constructor(agentId: number) {
    super();
    this.agentId = agentId;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    await this.updateStatus('running');
    await this.log('info', 'Agent started');
    
    this.processQueue();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    await this.updateStatus('idle');
    await this.log('info', 'Agent stopped');
  }

  async addTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    if (this.isRunning && !this.currentTask) {
      this.processQueue();
    }
  }

  protected async processQueue(): Promise<void> {
    while (this.isRunning && this.taskQueue.length > 0) {
      this.currentTask = this.taskQueue.shift()!;
      
      try {
        await this.updateStatus('working', this.currentTask.type);
        await this.log('info', `Starting task: ${this.currentTask.type}`);
        
        await this.executeTask(this.currentTask);
        
        await this.log('info', `Completed task: ${this.currentTask.type}`);
      } catch (error) {
        await this.log('error', `Task failed: ${this.currentTask.type}`, { error: error.message });
        this.emit('taskError', this.currentTask, error);
      } finally {
        this.currentTask = null;
        await this.updateProgress(0);
      }
    }
    
    if (this.isRunning) {
      await this.updateStatus('running');
    }
  }

  protected abstract executeTask(task: AgentTask): Promise<void>;

  protected async updateStatus(status: string, currentTask?: string): Promise<void> {
    await storage.updateAgent(this.agentId, {
      status,
      currentTask: currentTask || null,
      updatedAt: new Date()
    });
  }

  protected async updateProgress(progress: number): Promise<void> {
    await storage.updateAgent(this.agentId, {
      progress,
      updatedAt: new Date()
    });
  }

  protected async log(level: string, message: string, metadata?: any): Promise<void> {
    await storage.createSystemLog({
      level,
      message,
      source: this.constructor.name,
      agentId: this.agentId,
      metadata
    });
  }

  protected async createActivity(type: string, title: string, description?: string, projectId?: number): Promise<void> {
    await storage.createActivity({
      type,
      title,
      description,
      status: 'completed',
      agentId: this.agentId,
      projectId,
      metadata: {}
    });
  }
}
