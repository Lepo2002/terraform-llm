import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { ProjectModal } from "@/components/projects/project-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  FolderIcon, 
  TrashIcon, 
  ExternalLinkIcon,
  GitBranchIcon,
  CloudIcon,
  CalendarIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

export default function Projects() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-info";
      case "generated":
        return "status-online";
      case "deployed":
        return "status-online";
      case "failed":
        return "status-error";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getProjectTypeIcon = (type: string) => {
    return FolderIcon;
  };

  if (error) {
    return (
      <div className="flex-1 p-6">
        <TopBar 
          title="Projects" 
          subtitle="Manage your AI-generated projects"
          onCreateProject={() => setIsProjectModalOpen(true)}
        />
        <div className="mt-6">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">Error</Badge>
                <span className="text-red-800 dark:text-red-200">
                  Failed to load projects: {error.message}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <TopBar 
        title="Projects" 
        subtitle="Manage your AI-generated projects"
        onCreateProject={() => setIsProjectModalOpen(true)}
      />
      
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
              No Projects Yet
            </h3>
            <p className="text-slate-500 dark:text-slate-500 mb-6">
              Create your first AI-generated project to get started
            </p>
            <Button onClick={() => setIsProjectModalOpen(true)} className="bg-primary hover:bg-blue-700">
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const ProjectIcon = getProjectTypeIcon(project.type);
              
              return (
                <Card key={project.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ProjectIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
                            {project.name}
                          </CardTitle>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {project.type}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        Created {formatDistanceToNow(new Date(project.createdAt))} ago
                      </div>
                      {project.config?.database && (
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          Database: {project.config.database}
                        </div>
                      )}
                      {project.config?.cloudProvider && (
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <CloudIcon className="w-3 h-3 mr-1" />
                          {project.config.cloudProvider}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <ExternalLinkIcon className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {project.config?.autoGit && (
                          <Button variant="outline" size="sm">
                            <GitBranchIcon className="w-3 h-3 mr-1" />
                            Git
                          </Button>
                        )}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{project.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteProjectMutation.mutate(project.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteProjectMutation.isPending}
                            >
                              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={() => {
          setIsProjectModalOpen(false);
          toast({
            title: "Project Created",
            description: "Your project is being generated by our AI agents.",
          });
        }}
      />
    </div>
  );
}
