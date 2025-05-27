import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  agents, type Agent, type InsertAgent,
  activities, type Activity, type InsertActivity,
  deployments, type Deployment, type InsertDeployment,
  gitRepositories, type GitRepository, type InsertGitRepository,
  systemLogs, type SystemLog, type InsertSystemLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Agents
  getAgent(id: number): Promise<Agent | undefined>;
  getAgents(): Promise<Agent[]>;
  getActiveAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Deployments
  getDeployments(): Promise<Deployment[]>;
  getDeploymentsByProject(projectId: number): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined>;

  // Git Repositories
  getGitRepository(projectId: number): Promise<GitRepository | undefined>;
  createGitRepository(repo: InsertGitRepository): Promise<GitRepository>;
  updateGitRepository(id: number, updates: Partial<GitRepository>): Promise<GitRepository | undefined>;

  // System Logs
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private agents: Map<number, Agent>;
  private activities: Map<number, Activity>;
  private deployments: Map<number, Deployment>;
  private gitRepositories: Map<number, GitRepository>;
  private systemLogs: Map<number, SystemLog>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.agents = new Map();
    this.activities = new Map();
    this.deployments = new Map();
    this.gitRepositories = new Map();
    this.systemLogs = new Map();
    this.currentId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentId++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      status: "active",
      createdAt: now, 
      updatedAt: now 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Agents
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getActiveAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => 
      agent.status === "running" || agent.status === "working"
    );
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentId++;
    const now = new Date();
    const agent: Agent = { 
      ...insertAgent, 
      id, 
      status: "idle",
      currentTask: null,
      progress: 0,
      createdAt: now, 
      updatedAt: now 
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = { ...agent, ...updates, updatedAt: new Date() };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  // Activities
  async getActivities(limit = 50): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return activities.slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId++;
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Deployments
  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values());
  }

  async getDeploymentsByProject(projectId: number): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).filter(d => d.projectId === projectId);
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = this.currentId++;
    const now = new Date();
    const deployment: Deployment = { 
      ...insertDeployment, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updatedDeployment = { ...deployment, ...updates, updatedAt: new Date() };
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }

  // Git Repositories
  async getGitRepository(projectId: number): Promise<GitRepository | undefined> {
    return Array.from(this.gitRepositories.values()).find(repo => repo.projectId === projectId);
  }

  async createGitRepository(insertRepo: InsertGitRepository): Promise<GitRepository> {
    const id = this.currentId++;
    const repo: GitRepository = { 
      ...insertRepo, 
      id, 
      branch: insertRepo.branch || "main",
      lastCommit: null,
      lastAnalyzed: null,
      createdAt: new Date() 
    };
    this.gitRepositories.set(id, repo);
    return repo;
  }

  async updateGitRepository(id: number, updates: Partial<GitRepository>): Promise<GitRepository | undefined> {
    const repo = this.gitRepositories.get(id);
    if (!repo) return undefined;
    
    const updatedRepo = { ...repo, ...updates };
    this.gitRepositories.set(id, updatedRepo);
    return updatedRepo;
  }

  // System Logs
  async getSystemLogs(limit = 100): Promise<SystemLog[]> {
    const logs = Array.from(this.systemLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return logs.slice(0, limit);
  }

  async createSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const id = this.currentId++;
    const log: SystemLog = { 
      ...insertLog, 
      id, 
      createdAt: new Date() 
    };
    this.systemLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
