import { storage } from '../storage';
import type { Project, InsertProject } from '@shared/schema';
import path from 'path';
import fs from 'fs/promises';

export class ProjectService {
  private projectsDir = path.join(process.cwd(), 'generated_projects');

  constructor() {
    this.ensureProjectsDir();
  }

  private async ensureProjectsDir(): Promise<void> {
    try {
      await fs.access(this.projectsDir);
    } catch {
      await fs.mkdir(this.projectsDir, { recursive: true });
    }
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const project = await storage.createProject(projectData);
    
    // Create project directory
    const projectPath = path.join(this.projectsDir, project.name);
    await fs.mkdir(projectPath, { recursive: true });
    
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return await storage.getProject(id);
  }

  async getProjects(): Promise<Project[]> {
    return await storage.getProjects();
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    return await storage.updateProject(id, updates);
  }

  async deleteProject(id: number): Promise<boolean> {
    const project = await storage.getProject(id);
    if (!project) return false;
    
    // Remove project directory
    const projectPath = path.join(this.projectsDir, project.name);
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to remove project directory: ${error.message}`);
    }
    
    return await storage.deleteProject(id);
  }

  async getProjectPath(projectName: string): Promise<string> {
    return path.join(this.projectsDir, projectName);
  }

  async getProjectFiles(projectName: string): Promise<string[]> {
    const projectPath = path.join(this.projectsDir, projectName);
    
    try {
      const files = await this.getAllFiles(projectPath);
      return files.map(file => path.relative(projectPath, file));
    } catch (error) {
      return [];
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }

  async getProjectStats(): Promise<{
    total: number;
    active: number;
    generated: number;
    deployed: number;
  }> {
    const projects = await storage.getProjects();
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      generated: projects.filter(p => p.status === 'generated').length,
      deployed: projects.filter(p => p.status === 'deployed').length
    };
  }

  getProjectTypeTemplates(): { [type: string]: any } {
    return {
      'Flask REST API': {
        language: 'python',
        framework: 'flask',
        database: 'postgresql',
        features: ['rest_api', 'authentication', 'database_orm']
      },
      'Django Web App': {
        language: 'python',
        framework: 'django',
        database: 'postgresql',
        features: ['web_interface', 'admin_panel', 'authentication']
      },
      'FastAPI Microservice': {
        language: 'python',
        framework: 'fastapi',
        database: 'postgresql',
        features: ['rest_api', 'async_support', 'auto_documentation']
      },
      'React Frontend': {
        language: 'typescript',
        framework: 'react',
        database: null,
        features: ['spa', 'responsive_design', 'state_management']
      },
      'Node.js Backend': {
        language: 'typescript',
        framework: 'express',
        database: 'postgresql',
        features: ['rest_api', 'authentication', 'middleware']
      }
    };
  }
}
