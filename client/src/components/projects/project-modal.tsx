import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, WandIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Name too long"),
  type: z.string().min(1, "Project type is required"),
  description: z.string().optional(),
  database: z.string().min(1, "Database is required"),
  cloudProvider: z.string().min(1, "Cloud provider is required"),
  pipelineType: z.string().min(1, "Pipeline type is required"),
  complianceLevel: z.string().min(1, "Compliance level is required"),
  securityTier: z.string().min(1, "Security tier is required"),
  autoGit: z.boolean().default(false),
  autoDeploy: z.boolean().default(false),
  githubEnterprise: z.boolean().default(false),
  enableMigration: z.boolean().default(false),
  enableHSM: z.boolean().default(false),
  enableSOC2: z.boolean().default(false),
  enableGDPR: z.boolean().default(false),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      database: "",
      cloudProvider: "",
      autoGit: false,
      autoDeploy: false,
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const projectConfig = {
        database: data.database,
        cloudProvider: data.cloudProvider,
        autoGit: data.autoGit,
        autoDeploy: data.autoDeploy,
      };

      await apiRequest("POST", "/api/projects", {
        name: data.name,
        type: data.type,
        description: data.description,
        config: projectConfig,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onSuccess();
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };

  const projectTypes = [
    // Standard Applications
    { value: "Flask REST API", label: "Flask REST API" },
    { value: "Django Web App", label: "Django Web App" },
    { value: "FastAPI Microservice", label: "FastAPI Microservice" },
    { value: "React Frontend", label: "React Frontend" },
    { value: "Node.js Backend", label: "Node.js Backend" },
    
    // Enterprise & Government Solutions
    { value: "Banking Core System", label: "🏦 Banking Core System" },
    { value: "Payment Gateway", label: "💳 Payment Gateway" },
    { value: "Government Portal", label: "🏛️ Government Portal" },
    { value: "Compliance System", label: "📋 Compliance & Audit System" },
    { value: "Identity Management", label: "🔐 Identity Management System" },
    { value: "Enterprise ERP", label: "🏢 Enterprise ERP" },
    { value: "Healthcare System", label: "🏥 Healthcare Management" },
    { value: "FinTech Platform", label: "💰 FinTech Platform" },
    { value: "Insurance Platform", label: "🛡️ Insurance Platform" },
    { value: "Public Service Platform", label: "🌐 Public Service Platform" },
    { value: "Defense System", label: "⚔️ Defense & Security System" },
    { value: "Smart City Platform", label: "🏙️ Smart City Platform" },
  ];

  const databases = [
    // Standard Databases
    { value: "postgresql", label: "PostgreSQL" },
    { value: "mysql", label: "MySQL" },
    { value: "mongodb", label: "MongoDB" },
    { value: "sqlite", label: "SQLite" },
    { value: "redis", label: "Redis" },
    
    // Enterprise & High-Security Databases
    { value: "oracle-enterprise", label: "🏢 Oracle Enterprise" },
    { value: "sql-server-enterprise", label: "🏢 SQL Server Enterprise" },
    { value: "db2-enterprise", label: "🏢 IBM DB2 Enterprise" },
    { value: "cassandra-enterprise", label: "🔄 Cassandra Enterprise" },
    { value: "vault-hashicorp", label: "🔐 HashiCorp Vault" },
    { value: "cockroachdb-enterprise", label: "🌐 CockroachDB Enterprise" },
    { value: "snowflake-enterprise", label: "❄️ Snowflake Data Warehouse" },
    { value: "elasticsearch-enterprise", label: "🔍 Elasticsearch Enterprise" },
  ];

  const cloudProviders = [
    { value: "aws", label: "AWS" },
    { value: "gcp", label: "Google Cloud" },
    { value: "azure", label: "Microsoft Azure" },
    { value: "digitalocean", label: "DigitalOcean" },
    { value: "kubernetes", label: "Kubernetes (Any Provider)" },
    { value: "docker", label: "Docker Containers" },
  ];

  const pipelineTypes = [
    { value: "github-actions", label: "GitHub Actions" },
    { value: "azure-devops", label: "Azure DevOps" },
    { value: "jenkins", label: "Jenkins" },
    { value: "gitlab-ci", label: "GitLab CI/CD" },
    { value: "circleci", label: "CircleCI" },
    { value: "aws-codepipeline", label: "AWS CodePipeline" },
    { value: "gcp-cloud-build", label: "Google Cloud Build" },
  ];

  const complianceLevels = [
    { value: "standard", label: "🔒 Standard" },
    { value: "gdpr", label: "🇪🇺 GDPR Compliant" },
    { value: "pci-dss", label: "💳 PCI DSS Level 1" },
    { value: "sox", label: "📊 SOX Compliant" },
    { value: "hipaa", label: "🏥 HIPAA Compliant" },
    { value: "iso27001", label: "🌐 ISO 27001" },
    { value: "agid", label: "🇮🇹 AGID PA Compliant" },
    { value: "basel-iii", label: "🏦 Basel III Banking" },
    { value: "cis-controls", label: "🛡️ CIS Controls" },
    { value: "nist-framework", label: "🔐 NIST Cybersecurity Framework" },
  ];

  const securityTiers = [
    { value: "basic", label: "🟢 Basic Security" },
    { value: "enhanced", label: "🟡 Enhanced Security" },
    { value: "enterprise", label: "🟠 Enterprise Security" },
    { value: "government", label: "🔴 Government Grade" },
    { value: "military", label: "⚫ Military Grade" },
    { value: "banking", label: "🏦 Banking Grade" },
    { value: "healthcare", label: "🏥 Healthcare Grade" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <WandIcon className="w-5 h-5 text-primary" />
            <span>Create New Project</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="my-awesome-project" 
                      {...field}
                      disabled={createProjectMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={createProjectMutation.isPending}>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your project..."
                      className="resize-none"
                      {...field}
                      disabled={createProjectMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="database"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Database</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={createProjectMutation.isPending}>
                          <SelectValue placeholder="Select database" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {databases.map((db) => (
                          <SelectItem key={db.value} value={db.value}>
                            {db.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cloudProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cloud Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={createProjectMutation.isPending}>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cloudProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pipelineType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CI/CD Pipeline</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={createProjectMutation.isPending}>
                          <SelectValue placeholder="Select pipeline type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelineTypes.map((pipeline) => (
                          <SelectItem key={pipeline.value} value={pipeline.value}>
                            {pipeline.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complianceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={createProjectMutation.isPending}>
                          <SelectValue placeholder="Select compliance level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {complianceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="securityTier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={createProjectMutation.isPending}>
                          <SelectValue placeholder="Select security tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {securityTiers.map((tier) => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoGit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Initialize Git repository</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Automatically create a Git repository for version control
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoDeploy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Auto-deploy to cloud</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Generate infrastructure configuration and prepare for deployment
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubEnterprise"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>GitHub Enterprise integration</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable advanced Git workflows and enterprise features
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableMigration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Migration support</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable cloud provider migration and on-premises to cloud tools
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableHSM"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hardware Security Module (HSM)</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable HSM for cryptographic key management (banking grade)
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableSOC2"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>SOC 2 Type II Compliance</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable SOC 2 controls and audit logging
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableGDPR"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={createProjectMutation.isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>GDPR Data Protection</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enable GDPR compliance features and data protection
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {createProjectMutation.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">Error</Badge>
                  <span className="text-sm text-red-800 dark:text-red-200">
                    {createProjectMutation.error.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-blue-700"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <WandIcon className="w-4 h-4 mr-2" />
                    Generate Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
