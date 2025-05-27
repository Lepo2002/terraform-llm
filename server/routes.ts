import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AgentManager } from "./agents/agent-manager";
import { ProjectService } from "./services/project-service";
import { TerraformService } from "./services/terraform-service";
import { GitService } from "./services/git-service";
import { insertProjectSchema, insertGitRepositorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const agentManager = AgentManager.getInstance();
  const projectService = new ProjectService();
  const terraformService = new TerraformService();
  const gitService = new GitService();

  // Initialize agents on startup
  await agentManager.initializeAgents();

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const agents = await storage.getAgents();
      const activities = await storage.getActivities(10);
      const deployments = await storage.getDeployments();
      const systemLogs = await storage.getSystemLogs(50);

      const stats = {
        system: {
          uptime: "99.9%",
          status: "online"
        },
        projects: {
          total: projects.length,
          active: projects.filter(p => p.status === "active").length,
          generated: projects.filter(p => p.status === "generated").length
        },
        agents: {
          total: agents.length,
          active: agents.filter(a => a.status === "running" || a.status === "working").length,
          running: agents.filter(a => a.status === "running").length
        },
        deployments: {
          count: deployments.length,
          live: deployments.filter(d => d.status === "deployed").length,
          issues: deployments.filter(d => d.status === "failed").length
        },
        api: {
          requests: 1247,
          successRate: "99.2%"
        }
      };

      res.json({
        stats,
        recentActivities: activities,
        activeAgents: agents.filter(a => a.status === "running" || a.status === "working"),
        systemLogs: systemLogs.slice(0, 10)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Project endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const createProjectSchema = insertProjectSchema.extend({
        database: z.string().optional(),
        cloudProvider: z.string().optional(),
        autoGit: z.boolean().optional(),
        autoDeploy: z.boolean().optional()
      });

      const validatedData = createProjectSchema.parse(req.body);
      
      const projectConfig = {
        ...validatedData.config,
        database: req.body.database || "postgresql",
        cloudProvider: req.body.cloudProvider || "aws",
        autoGit: req.body.autoGit || false,
        autoDeploy: req.body.autoDeploy || false
      };

      const project = await projectService.createProject({
        name: validatedData.name,
        type: validatedData.type,
        description: validatedData.description,
        config: projectConfig
      });

      // Trigger agent to generate project
      await agentManager.createProject({
        ...project,
        config: projectConfig
      });

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const deployments = await storage.getDeploymentsByProject(id);
      const gitRepo = await storage.getGitRepository(id);
      
      res.json({
        ...project,
        deployments,
        gitRepository: gitRepo
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await projectService.deleteProject(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agent endpoints
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await agentManager.startAgent(id);
      res.json({ message: "Agent started successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await agentManager.stopAgent(id);
      res.json({ message: "Agent stopped successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activity endpoints
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // System logs endpoints
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getSystemLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Terraform endpoints
  app.get("/api/terraform/:projectId/:environment", async (req, res) => {
    try {
      const { projectId, environment } = req.params;
      const files = await terraformService.getTerraformFiles(parseInt(projectId), environment);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/terraform/:projectId/:environment/plan", async (req, res) => {
    try {
      const { projectId, environment } = req.params;
      const plan = await terraformService.generatePlan(parseInt(projectId), environment);
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Git endpoints
  app.post("/api/git/repositories", async (req, res) => {
    try {
      const validatedData = insertGitRepositorySchema.parse(req.body);
      const repository = await storage.createGitRepository(validatedData);
      res.status(201).json(repository);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/git/repositories/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const repository = await storage.getGitRepository(projectId);
      
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      res.json(repository);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Learning endpoints
  app.post("/api/learning/analyze", async (req, res) => {
    try {
      const { projectId, repositoryPath } = req.body;
      
      await agentManager.assignTask('learning', {
        id: `learn_${projectId}_${Date.now()}`,
        type: 'analyze_commits',
        payload: { projectId, repositoryPath },
        priority: 5
      });

      res.json({ message: "Learning analysis started" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      agents: agentManager ? "initialized" : "not_initialized"
    });
  });

  // Chat API
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { message, projectId, context } = req.body;
      
      // Simuliamo una risposta intelligente dell'agente
      const responses = {
        "crea un sistema bancario": {
          response: "Perfetto! Sto creando un sistema bancario completo con:\n- API REST per transazioni\n- Database sicuro per conti e movimenti\n- Sistema di autenticazione multi-fattore\n- Compliance PCI DSS\n- Dashboard amministrativa\n\nVuoi che proceda con il deployment su AWS o Azure?",
          agentType: "Banking Architect",
          suggestedActions: ["Deploy su AWS", "Deploy su Azure", "Configura database Oracle", "Setup compliance PCI DSS"]
        },
        "deploy": {
          response: "Sto preparando il deployment automatico:\n- Generazione Terraform per infrastruttura\n- Setup pipeline CI/CD\n- Configurazione domini e SSL\n- Monitoraggio e backup automatici\n\nSeleziona il cloud provider per iniziare.",
          agentType: "DevOps Engineer",
          suggestedActions: ["AWS con Kubernetes", "Azure Container Apps", "GCP Cloud Run", "Multi-cloud setup"]
        },
        "importa": {
          response: "Posso importare il tuo repository GitHub e:\n- Analizzare automaticamente le tecnologie\n- Configurare l'ambiente di sviluppo\n- Creare pipeline CI/CD\n- Setup deployment automatico\n\nIncolla l'URL del repository per iniziare.",
          agentType: "Integration Specialist",
          suggestedActions: ["Analizza repository", "Setup CI/CD", "Configura deployment", "Migrazione cloud"]
        }
      };

      // Trova la risposta più appropriata
      const lowercaseMessage = message.toLowerCase();
      let responseData = {
        response: "Ho capito! Posso aiutarti con sviluppo, deployment e gestione completa del progetto. Cosa ti serve specificatamente?",
        agentType: "AI Assistant",
        suggestedActions: ["Crea nuovo progetto", "Deploy infrastruttura", "Importa da GitHub", "Setup CI/CD"]
      };

      for (const [key, value] of Object.entries(responses)) {
        if (lowercaseMessage.includes(key)) {
          responseData = value;
          break;
        }
      }

      res.json(responseData);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // GitHub Import API
  app.post("/api/github/import", async (req, res) => {
    try {
      const { repoUrl, projectName, description, autoSetup, createPipeline } = req.body;
      
      // Simula l'analisi del repository
      const gitUrlRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = repoUrl.match(gitUrlRegex);
      
      if (!match) {
        return res.status(400).json({ error: "URL GitHub non valido" });
      }

      const [, owner, repo] = match;
      
      // Crea il progetto
      const project = await storage.createProject({
        name: projectName,
        type: "GitHub Import",
        description: description || `Progetto importato da ${owner}/${repo}`,
        config: {
          source: "github",
          repoUrl,
          owner,
          repo,
          autoSetup,
          createPipeline,
          technologies: ["JavaScript", "Node.js", "React"],
          structure: "Monorepo",
          complexity: "Medium"
        }
      });

      // Crea attività per il setup automatico
      if (autoSetup) {
        await storage.createActivity({
          type: "setup",
          title: `Setup automatico per ${projectName}`,
          description: "Configurazione ambiente di sviluppo",
          status: "pending",
          projectId: project.id,
          metadata: { repoUrl, autoSetup: true }
        });
      }

      if (createPipeline) {
        await storage.createActivity({
          type: "deployment",
          title: `Pipeline CI/CD per ${projectName}`,
          description: "Creazione pipeline automatica",
          status: "pending", 
          projectId: project.id,
          metadata: { repoUrl, pipeline: true }
        });
      }

      res.json({ 
        success: true, 
        project,
        message: "Repository importato con successo!"
      });
    } catch (error) {
      console.error("Error importing GitHub repo:", error);
      res.status(500).json({ error: "Errore nell'importazione del repository" });
    }
  });

  // Deployment API
  app.post("/api/projects/:id/deploy", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { provider, environment, config } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Crea deployment
      const deployment = await storage.createDeployment({
        projectId,
        environment: environment || "production",
        status: "deploying",
        url: `https://${project.name.toLowerCase().replace(/\s+/g, '-')}-${environment || 'prod'}.${provider || 'aws'}.app`,
        terraformState: {
          provider,
          region: config?.region || "eu-west-1",
          resources: []
        }
      });

      // Crea attività di deployment
      await storage.createActivity({
        type: "deployment",
        title: `Deploy ${project.name} su ${provider}`,
        description: `Deployment automatico in corso...`,
        status: "in_progress",
        projectId,
        metadata: { deploymentId: deployment.id, provider, environment }
      });

      // Simula il completamento dopo 5 secondi
      setTimeout(async () => {
        await storage.updateDeployment(deployment.id, {
          status: "deployed"
        });
        
        await storage.createActivity({
          type: "deployment",
          title: `Deploy completato per ${project.name}`,
          description: `Applicazione disponibile su ${deployment.url}`,
          status: "completed",
          projectId,
          metadata: { deploymentId: deployment.id, url: deployment.url }
        });
      }, 5000);

      res.json({ 
        success: true, 
        deployment,
        message: "Deployment avviato con successo!"
      });
    } catch (error) {
      console.error("Error deploying project:", error);
      res.status(500).json({ error: "Errore nel deployment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
