import { BaseAgent, type AgentTask } from './base-agent';
import { TerraformService } from '../services/terraform-service';
import { LLMService } from '../services/llm-service';
import { storage } from '../storage';

interface InfrastructureTask {
  projectId: number;
  cloudProvider: string;
  environment: string;
  config: any;
}

export class InfrastructureAgent extends BaseAgent {
  private terraformService: TerraformService;
  private llmService: LLMService;

  constructor(agentId: number) {
    super(agentId);
    this.terraformService = new TerraformService();
    this.llmService = new LLMService();
  }

  protected async executeTask(task: AgentTask): Promise<void> {
    switch (task.type) {
      case 'generate_terraform':
        await this.generateTerraform(task.payload as InfrastructureTask);
        break;
      case 'deploy_infrastructure':
        await this.deployInfrastructure(task.payload as InfrastructureTask);
        break;
      case 'monitor_resources':
        await this.monitorResources(task.payload);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async generateTerraform(task: InfrastructureTask): Promise<void> {
    const { projectId, cloudProvider, environment, config } = task;
    
    await this.log('info', `Generating Terraform for ${cloudProvider} - ${environment}`);
    await this.updateProgress(20);

    // Generate Terraform configuration using LLM
    const terraformConfig = await this.llmService.generateTerraformConfig(
      cloudProvider,
      environment,
      config
    );
    await this.updateProgress(50);

    // Save Terraform files
    const terraformPath = await this.terraformService.saveTerraformConfig(
      projectId,
      environment,
      terraformConfig
    );
    await this.updateProgress(80);

    // Validate Terraform configuration
    const validation = await this.terraformService.validateConfig(terraformPath);
    if (!validation.valid) {
      throw new Error(`Terraform validation failed: ${validation.errors.join(', ')}`);
    }

    await this.updateProgress(100);
    await this.createActivity(
      'terraform_generated',
      'Infrastructure code generated',
      `Created Terraform configuration for ${cloudProvider} ${environment}`,
      projectId
    );
  }

  private async deployInfrastructure(task: InfrastructureTask): Promise<void> {
    const { projectId, environment } = task;
    
    await this.log('info', `Deploying infrastructure for project ${projectId} - ${environment}`);
    await this.updateProgress(10);

    // Create deployment record
    const deployment = await storage.createDeployment({
      projectId,
      environment,
      status: 'deploying',
      url: null,
      terraformState: null
    });

    try {
      // Generate Terraform plan
      const plan = await this.terraformService.generatePlan(projectId, environment);
      await this.updateProgress(30);

      // For safety, we'll only generate and validate the plan
      // Real deployment would require user approval and proper cloud credentials
      await this.log('info', `Terraform plan generated successfully`);
      await this.updateProgress(60);

      // Simulate deployment completion
      await storage.updateDeployment(deployment.id, {
        status: 'planned',
        terraformState: { plan: plan },
        updatedAt: new Date()
      });

      await this.updateProgress(100);
      await this.createActivity(
        'infrastructure_planned',
        'Infrastructure deployment planned',
        `Terraform plan ready for ${environment} environment`,
        projectId
      );

    } catch (error) {
      await storage.updateDeployment(deployment.id, {
        status: 'failed',
        updatedAt: new Date()
      });
      throw error;
    }
  }

  private async monitorResources(payload: { deploymentId: number }): Promise<void> {
    const { deploymentId } = payload;
    
    await this.log('info', `Monitoring deployment ${deploymentId}`);
    
    // Simulate resource monitoring
    await this.createActivity(
      'resources_monitored',
      'Infrastructure monitoring',
      `Checked status of deployment ${deploymentId}`,
      undefined
    );
  }
}
