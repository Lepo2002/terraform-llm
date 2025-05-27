import { apiRequest } from "./queryClient";

export interface DashboardStats {
  system: {
    uptime: string;
    status: string;
  };
  projects: {
    total: number;
    active: number;
    generated: number;
  };
  agents: {
    total: number;
    active: number;
    running: number;
  };
  deployments: {
    count: number;
    live: number;
    issues: number;
  };
  api: {
    requests: number;
    successRate: string;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: Array<{
    id: number;
    type: string;
    title: string;
    description?: string;
    status: string;
    createdAt: Date;
  }>;
  activeAgents: Array<{
    id: number;
    name: string;
    type: string;
    status: string;
    currentTask?: string;
    progress: number;
  }>;
  systemLogs: Array<{
    id: number;
    level: string;
    message: string;
    source?: string;
    createdAt: Date;
  }>;
}

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardData> => {
    const response = await apiRequest("GET", "/api/dashboard/stats");
    return response.json();
  },

  // Projects
  getProjects: async () => {
    const response = await apiRequest("GET", "/api/projects");
    return response.json();
  },

  createProject: async (projectData: {
    name: string;
    type: string;
    description?: string;
    config: any;
  }) => {
    const response = await apiRequest("POST", "/api/projects", projectData);
    return response.json();
  },

  getProject: async (id: number) => {
    const response = await apiRequest("GET", `/api/projects/${id}`);
    return response.json();
  },

  deleteProject: async (id: number) => {
    const response = await apiRequest("DELETE", `/api/projects/${id}`);
    return response.json();
  },

  // Agents
  getAgents: async () => {
    const response = await apiRequest("GET", "/api/agents");
    return response.json();
  },

  startAgent: async (id: number) => {
    const response = await apiRequest("POST", `/api/agents/${id}/start`);
    return response.json();
  },

  stopAgent: async (id: number) => {
    const response = await apiRequest("POST", `/api/agents/${id}/stop`);
    return response.json();
  },

  // Activities
  getActivities: async (limit = 50) => {
    const response = await apiRequest("GET", `/api/activities?limit=${limit}`);
    return response.json();
  },

  // System Logs
  getSystemLogs: async (limit = 100) => {
    const response = await apiRequest("GET", `/api/logs?limit=${limit}`);
    return response.json();
  },

  // Terraform
  getTerraformFiles: async (projectId: number, environment: string) => {
    const response = await apiRequest("GET", `/api/terraform/${projectId}/${environment}`);
    return response.json();
  },

  generateTerraformPlan: async (projectId: number, environment: string) => {
    const response = await apiRequest("POST", `/api/terraform/${projectId}/${environment}/plan`);
    return response.json();
  },

  // Git
  createGitRepository: async (data: {
    projectId: number;
    url: string;
    branch?: string;
  }) => {
    const response = await apiRequest("POST", "/api/git/repositories", data);
    return response.json();
  },

  getGitRepository: async (projectId: number) => {
    const response = await apiRequest("GET", `/api/git/repositories/${projectId}`);
    return response.json();
  },

  // Learning
  startLearningAnalysis: async (projectId: number, repositoryPath: string) => {
    const response = await apiRequest("POST", "/api/learning/analyze", {
      projectId,
      repositoryPath,
    });
    return response.json();
  },

  // Health
  getHealth: async () => {
    const response = await apiRequest("GET", "/api/health");
    return response.json();
  },
};
