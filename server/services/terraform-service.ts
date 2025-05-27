import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TerraformService {
  private terraformDir = path.join(process.cwd(), 'terraform_configs');

  constructor() {
    this.ensureTerraformDir();
  }

  private async ensureTerraformDir(): Promise<void> {
    try {
      await fs.access(this.terraformDir);
    } catch {
      await fs.mkdir(this.terraformDir, { recursive: true });
    }
  }

  async saveTerraformConfig(projectId: number, environment: string, config: { [filename: string]: string }): Promise<string> {
    const projectTerraformDir = path.join(this.terraformDir, `project_${projectId}`, environment);
    await fs.mkdir(projectTerraformDir, { recursive: true });

    // Write all terraform files
    for (const [filename, content] of Object.entries(config)) {
      const filePath = path.join(projectTerraformDir, filename);
      await fs.writeFile(filePath, content);
    }

    return projectTerraformDir;
  }

  async validateConfig(terraformPath: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      // Note: This would require Terraform to be installed
      // For development, we'll simulate validation
      const files = await fs.readdir(terraformPath);
      const terraformFiles = files.filter(file => file.endsWith('.tf'));
      
      if (terraformFiles.length === 0) {
        return { valid: false, errors: ['No Terraform files found'] };
      }

      // Basic validation - check if main.tf exists and has content
      const mainTfPath = path.join(terraformPath, 'main.tf');
      try {
        const content = await fs.readFile(mainTfPath, 'utf-8');
        if (content.trim().length === 0) {
          return { valid: false, errors: ['main.tf is empty'] };
        }
      } catch {
        return { valid: false, errors: ['main.tf not found'] };
      }

      return { valid: true, errors: [] };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  async generatePlan(projectId: number, environment: string): Promise<any> {
    const terraformPath = path.join(this.terraformDir, `project_${projectId}`, environment);
    
    try {
      // In a real implementation, this would run terraform plan
      // For development, we'll return a simulated plan
      const files = await fs.readdir(terraformPath);
      
      return {
        resources: {
          toAdd: 5,
          toChange: 0,
          toDestroy: 0
        },
        files: files.filter(f => f.endsWith('.tf')),
        estimatedCost: '$24.50/month',
        executionTime: '~2 minutes'
      };
    } catch (error) {
      throw new Error(`Failed to generate Terraform plan: ${error.message}`);
    }
  }

  async getProjectTerraformPath(projectId: number, environment: string): Promise<string> {
    return path.join(this.terraformDir, `project_${projectId}`, environment);
  }

  async getTerraformFiles(projectId: number, environment: string): Promise<{ [filename: string]: string }> {
    const terraformPath = path.join(this.terraformDir, `project_${projectId}`, environment);
    const files: { [filename: string]: string } = {};
    
    try {
      const fileList = await fs.readdir(terraformPath);
      
      for (const filename of fileList) {
        if (filename.endsWith('.tf')) {
          const content = await fs.readFile(path.join(terraformPath, filename), 'utf-8');
          files[filename] = content;
        }
      }
    } catch (error) {
      // Directory doesn't exist or no files
    }
    
    return files;
  }

  generateAWSTemplate(config: any): { [filename: string]: string } {
    const templates = {
      'main.tf': `
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "\${var.project_name}-igw"
    Environment = var.environment
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.\${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "\${var.project_name}-public-\${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}

# Security Group for Application
resource "aws_security_group" "app" {
  name_prefix = "\${var.project_name}-app"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "\${var.project_name}-app-sg"
    Environment = var.environment
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
`.trim(),

      'variables.tf': `
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "${config.name || 'llm-generated-project'}"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
`.trim(),

      'outputs.tf': `
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}
`.trim()
    };

    return templates;
  }
}
