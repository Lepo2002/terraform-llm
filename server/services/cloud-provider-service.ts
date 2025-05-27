import { TerraformService } from './terraform-service';
import { LLMService } from './llm-service';

export interface CloudProviderConfig {
  provider: 'aws' | 'azure' | 'gcp' | 'digitalocean' | 'kubernetes' | 'docker';
  region?: string;
  subscriptionId?: string;
  resourceGroup?: string;
  projectId?: string;
  credentials?: any;
}

export interface DeploymentTemplate {
  infrastructure: { [filename: string]: string };
  pipeline: { [filename: string]: string };
  kubernetes?: { [filename: string]: string };
  docker?: { [filename: string]: string };
}

export class CloudProviderService {
  private terraformService: TerraformService;
  private llmService: LLMService;

  constructor() {
    this.terraformService = new TerraformService();
    this.llmService = new LLMService();
  }

  async generateDeploymentTemplate(
    projectType: string,
    config: CloudProviderConfig,
    features: string[]
  ): Promise<DeploymentTemplate> {
    const template: DeploymentTemplate = {
      infrastructure: {},
      pipeline: {}
    };

    // Generate infrastructure code based on provider
    switch (config.provider) {
      case 'aws':
        template.infrastructure = await this.generateAWSInfrastructure(projectType, config, features);
        template.pipeline = await this.generateAWSPipeline(projectType, config);
        break;
      case 'azure':
        template.infrastructure = await this.generateAzureInfrastructure(projectType, config, features);
        template.pipeline = await this.generateAzurePipeline(projectType, config);
        break;
      case 'gcp':
        template.infrastructure = await this.generateGCPInfrastructure(projectType, config, features);
        template.pipeline = await this.generateGCPPipeline(projectType, config);
        break;
      case 'kubernetes':
        template.kubernetes = await this.generateKubernetesManifests(projectType, config, features);
        template.pipeline = await this.generateK8sPipeline(projectType, config);
        break;
      case 'docker':
        template.docker = await this.generateDockerConfiguration(projectType, config, features);
        template.pipeline = await this.generateDockerPipeline(projectType, config);
        break;
      default:
        throw new Error(`Unsupported cloud provider: ${config.provider}`);
    }

    return template;
  }

  private async generateAWSInfrastructure(
    projectType: string,
    config: CloudProviderConfig,
    features: string[]
  ): Promise<{ [filename: string]: string }> {
    const prompt = `Generate complete AWS Terraform configuration for a ${projectType} project with features: ${features.join(', ')}.
Include: VPC, ECS/EKS, RDS, S3, CloudFront, ALB, Route53, IAM roles, security groups.
Region: ${config.region || 'us-west-2'}
Return JSON with filename:content pairs.`;

    const response = await this.llmService.generateTerraformConfig('aws', 'production', {
      projectType,
      features,
      region: config.region
    });

    return response;
  }

  private async generateAzureInfrastructure(
    projectType: string,
    config: CloudProviderConfig,
    features: string[]
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['main.tf'] = `
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "\${var.project_name}-rg"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "\${var.project_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
  }
}

# Subnet
resource "azurerm_subnet" "internal" {
  name                 = "\${var.project_name}-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = "\${replace(var.project_name, "-", "")}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    Environment = var.environment
  }
}

# Azure Container Instances or AKS based on project type
${features.includes('kubernetes') ? `
# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = "\${var.project_name}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "\${var.project_name}-aks"

  default_node_pool {
    name       = "default"
    node_count = 2
    vm_size    = "Standard_D2_v2"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
  }
}
` : `
# Container Instance
resource "azurerm_container_group" "main" {
  name                = "\${var.project_name}-ci"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "Public"
  dns_name_label      = "\${var.project_name}-app"
  os_type             = "Linux"

  container {
    name   = "\${var.project_name}-app"
    image  = "\${azurerm_container_registry.main.login_server}/\${var.project_name}:latest"
    cpu    = "1"
    memory = "2"

    ports {
      port     = 80
      protocol = "TCP"
    }
  }

  tags = {
    Environment = var.environment
  }
}
`}
`;

    files['variables.tf'] = `
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "West Europe"
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}
`;

    files['outputs.tf'] = `
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_url" {
  description = "URL of the container registry"
  value       = azurerm_container_registry.main.login_server
}

${features.includes('kubernetes') ? `
output "kube_config" {
  description = "Kubernetes configuration"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}
` : `
output "app_url" {
  description = "Application URL"
  value       = "http://\${azurerm_container_group.main.fqdn}"
}
`}
`;

    return files;
  }

  private async generateGCPInfrastructure(
    projectType: string,
    config: CloudProviderConfig,
    features: string[]
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['main.tf'] = `
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable APIs
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

resource "google_project_service" "container" {
  service = "container.googleapis.com"
}

resource "google_project_service" "run" {
  service = "run.googleapis.com"
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "\${var.project_name}-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "main" {
  name          = "\${var.project_name}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

${features.includes('kubernetes') ? `
# GKE Cluster
resource "google_container_cluster" "main" {
  name     = "\${var.project_name}-gke"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.main.name
  subnetwork = google_compute_subnetwork.main.name

  depends_on = [google_project_service.container]
}

resource "google_container_node_pool" "main_nodes" {
  name       = "\${var.project_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.main.name
  node_count = 2

  node_config {
    preemptible  = true
    machine_type = "e2-medium"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
` : `
# Cloud Run Service
resource "google_cloud_run_service" "main" {
  name     = "\${var.project_name}-service"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/\${var.project_id}/\${var.project_name}:latest"
        
        ports {
          container_port = 8080
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# IAM policy for public access
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.main.name
  location = google_cloud_run_service.main.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
`}
`;

    files['variables.tf'] = `
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}"
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west1"
}
`;

    return files;
  }

  private async generateKubernetesManifests(
    projectType: string,
    config: CloudProviderConfig,
    features: string[]
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['deployment.yaml'] = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app
  labels:
    app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app
  template:
    metadata:
      labels:
        app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app
    spec:
      containers:
      - name: app
        image: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
`;

    files['service.yaml'] = `
apiVersion: v1
kind: Service
metadata:
  name: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-service
spec:
  selector:
    app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
`;

    files['ingress.yaml'] = `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}.example.com
    secretName: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-tls
  rules:
  - host: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-service
            port:
              number: 80
`;

    if (features.includes('database')) {
      files['database.yaml'] = `
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-db
spec:
  serviceName: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-db-service
  replicas: 1
  selector:
    matchLabels:
      app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-db
  template:
    metadata:
      labels:
        app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-db
    spec:
      containers:
      - name: postgres
        image: postgres:13
        env:
        - name: POSTGRES_DB
          value: "${projectType.toLowerCase().replace(/[^a-z0-9]/g, '_')}"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-db-service
spec:
  selector:
    app: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-db
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None
`;
    }

    return files;
  }

  private async generateDockerConfiguration(
    projectType: string,
    config: CloudProviderConfig,
    features: string[]
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['docker-compose.yml'] = `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '_')}
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=${projectType.toLowerCase().replace(/[^a-z0-9]/g, '_')}
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
`;

    files['Dockerfile.prod'] = `
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start"]
`;

    return files;
  }

  private async generateAzurePipeline(
    projectType: string,
    config: CloudProviderConfig
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['azure-pipelines.yml'] = `
trigger:
  branches:
    include:
    - main
    - develop

variables:
  - group: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-variables
  - name: containerRegistry
    value: \$(ACR_NAME).azurecr.io
  - name: imageRepository
    value: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}
  - name: dockerfilePath
    value: '**/Dockerfile'
  - name: tag
    value: '\$(Build.BuildId)'

stages:
- stage: Test
  displayName: 'Test Stage'
  jobs:
  - job: Test
    displayName: 'Run Tests'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
      displayName: 'Install Node.js'
    
    - script: |
        npm ci
        npm run test
        npm run lint
      displayName: 'Install dependencies and run tests'
    
    - task: PublishTestResults@2
      condition: succeededOrFailed()
      inputs:
        testRunner: JUnit
        testResultsFiles: '**/test-results.xml'

- stage: Build
  displayName: 'Build Stage'
  dependsOn: Test
  condition: succeeded()
  jobs:
  - job: Build
    displayName: 'Build and Push Image'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: Docker@2
      displayName: 'Build and push image'
      inputs:
        command: buildAndPush
        repository: \$(imageRepository)
        dockerfile: \$(dockerfilePath)
        containerRegistry: \$(dockerRegistryServiceConnection)
        tags: |
          \$(tag)
          latest

- stage: Deploy
  displayName: 'Deploy Stage'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: Deploy
    displayName: 'Deploy to Azure'
    pool:
      vmImage: 'ubuntu-latest'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureRmWebAppDeployment@4
            inputs:
              ConnectionType: 'AzureRM'
              azureSubscription: \$(azureServiceConnection)
              appType: 'webAppContainer'
              WebAppName: \$(webAppName)
              DockerNamespace: \$(containerRegistry)
              DockerRepository: \$(imageRepository)
              DockerImageTag: \$(tag)

- stage: Infrastructure
  displayName: 'Infrastructure as Code'
  dependsOn: []
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - job: Terraform
    displayName: 'Deploy Infrastructure'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: TerraformInstaller@0
      inputs:
        terraformVersion: '1.5.0'
    
    - task: TerraformTaskV4@4
      displayName: 'Terraform Init'
      inputs:
        provider: 'azurerm'
        command: 'init'
        workingDirectory: 'terraform'
        backendServiceArm: \$(azureServiceConnection)
        backendAzureRmResourceGroupName: \$(terraformBackendResourceGroup)
        backendAzureRmStorageAccountName: \$(terraformBackendStorageAccount)
        backendAzureRmContainerName: 'terraform'
        backendAzureRmKey: '\$(Build.Repository.Name).tfstate'
    
    - task: TerraformTaskV4@4
      displayName: 'Terraform Plan'
      inputs:
        provider: 'azurerm'
        command: 'plan'
        workingDirectory: 'terraform'
        environmentServiceNameAzureRM: \$(azureServiceConnection)
    
    - task: TerraformTaskV4@4
      displayName: 'Terraform Apply'
      inputs:
        provider: 'azurerm'
        command: 'apply'
        workingDirectory: 'terraform'
        environmentServiceNameAzureRM: \$(azureServiceConnection)
`;

    return files;
  }

  private async generateAWSPipeline(
    projectType: string,
    config: CloudProviderConfig
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['buildspec.yml'] = `
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region \$AWS_DEFAULT_REGION | docker login --username AWS --password-stdin \$AWS_ACCOUNT_ID.dkr.ecr.\$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=\$AWS_ACCOUNT_ID.dkr.ecr.\$AWS_DEFAULT_REGION.amazonaws.com/\$IMAGE_REPO_NAME
      - COMMIT_HASH=\$(echo \$CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t \$IMAGE_REPO_NAME .
      - docker tag \$IMAGE_REPO_NAME:latest \$REPOSITORY_URI:latest
      - docker tag \$IMAGE_REPO_NAME:latest \$REPOSITORY_URI:\$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push \$REPOSITORY_URI:latest
      - docker push \$REPOSITORY_URI:\$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-container","imageUri":"%s"}]' \$REPOSITORY_URI:\$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
    - terraform/**/*
`;

    files['.github/workflows/deploy.yml'] = `
name: Deploy to AWS

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  AWS_REGION: us-west-2
  ECR_REPOSITORY: ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test
    
    - name: Run linting
      run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: \${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: \${{ github.sha }}
      run: |
        docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
        docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
        echo "image=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v2
      with:
        terraform_version: 1.5.0

    - name: Terraform Init
      run: terraform init
      working-directory: ./terraform

    - name: Terraform Plan
      run: terraform plan -no-color
      working-directory: ./terraform

    - name: Terraform Apply
      if: github.ref == 'refs/heads/main'
      run: terraform apply -auto-approve
      working-directory: ./terraform
`;

    return files;
  }

  private async generateGCPPipeline(
    projectType: string,
    config: CloudProviderConfig
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['cloudbuild.yaml'] = `
steps:
  # Run tests
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['ci']
  
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['test']

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/\$PROJECT_ID/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}:\$COMMIT_SHA',
      '-t', 'gcr.io/\$PROJECT_ID/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}:latest',
      '.'
    ]

  # Push image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}:\$COMMIT_SHA']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}:latest']

  # Deploy with Terraform
  - name: 'hashicorp/terraform:1.5'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        cd terraform
        terraform init
        terraform plan -var="project_id=\$PROJECT_ID"
        terraform apply -auto-approve -var="project_id=\$PROJECT_ID"

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', '${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-service',
      '--image', 'gcr.io/\$PROJECT_ID/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}:\$COMMIT_SHA',
      '--platform', 'managed',
      '--region', 'europe-west1',
      '--allow-unauthenticated'
    ]

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'

substitutions:
  _SERVICE_NAME: '${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-service'
  _REGION: 'europe-west1'
`;

    return files;
  }

  private async generateK8sPipeline(
    projectType: string,
    config: CloudProviderConfig
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['.github/workflows/k8s-deploy.yml'] = `
name: Deploy to Kubernetes

on:
  push:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}

    - name: Set up kubectl
      uses: azure/setup-kubectl@v3

    - name: Deploy to Kubernetes
      env:
        KUBE_CONFIG: \${{ secrets.KUBE_CONFIG }}
        IMAGE_TAG: \${{ steps.meta.outputs.tags }}
      run: |
        echo "\$KUBE_CONFIG" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
        
        # Update image tag in deployment
        sed -i "s|IMAGE_TAG_PLACEHOLDER|\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}|g" k8s/deployment.yaml
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s/
        
        # Wait for rollout to complete
        kubectl rollout status deployment/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-app
        
        # Get service URL
        kubectl get service ${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-service
`;

    return files;
  }

  private async generateDockerPipeline(
    projectType: string,
    config: CloudProviderConfig
  ): Promise<{ [filename: string]: string }> {
    const files: { [filename: string]: string } = {};

    files['.github/workflows/docker.yml'] = `
name: Docker Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile.prod
        push: true
        tags: |
          \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
          \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy with Docker Compose
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: \${{ secrets.HOST }}
        username: \${{ secrets.USERNAME }}
        key: \${{ secrets.KEY }}
        script: |
          cd /opt/${projectType.toLowerCase().replace(/[^a-z0-9]/g, '-')}
          docker-compose pull
          docker-compose up -d
          docker system prune -f
`;

    return files;
  }

  async generateMigrationPlan(
    currentProvider: string,
    targetProvider: string,
    projectConfig: any
  ): Promise<{
    assessment: string;
    migrationSteps: string[];
    risks: string[];
    estimatedTime: string;
    costs: string;
  }> {
    const prompt = `Generate a detailed migration plan from ${currentProvider} to ${targetProvider} for a ${projectConfig.projectType} project.
    
Current configuration: ${JSON.stringify(projectConfig, null, 2)}

Return a comprehensive migration assessment including:
- Technical assessment of current infrastructure
- Step-by-step migration plan
- Risk analysis and mitigation strategies
- Time and cost estimates
- Rollback procedures`;

    // This would use the LLM service to generate a detailed migration plan
    return {
      assessment: `Migration from ${currentProvider} to ${targetProvider}`,
      migrationSteps: [
        "Assessment and inventory of current infrastructure",
        "Set up target environment",
        "Data migration planning",
        "Application refactoring if needed",
        "Testing and validation",
        "Gradual traffic migration",
        "Monitoring and optimization"
      ],
      risks: [
        "Data loss during migration",
        "Service downtime",
        "Cost overruns",
        "Performance degradation"
      ],
      estimatedTime: "4-8 weeks",
      costs: "Medium to High"
    };
  }
}