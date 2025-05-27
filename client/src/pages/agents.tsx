import { useQuery, useMutation } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BrainIcon, 
  LayersIcon, 
  GitBranchIcon,
  PlayIcon,
  PauseIcon,
  SettingsIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";

export default function Agents() {
  const { toast } = useToast();

  const { data: agents = [], isLoading, error } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const startAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      await apiRequest("POST", `/api/agents/${agentId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent Started",
        description: "The agent has been successfully started.",
      });
    },
    onError: (error) => {
      toast({
        title: "Start Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      await apiRequest("POST", `/api/agents/${agentId}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent Stopped",
        description: "The agent has been successfully stopped.",
      });
    },
    onError: (error) => {
      toast({
        title: "Stop Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'code_generator':
        return BrainIcon;
      case 'infrastructure':
        return LayersIcon;
      case 'learning':
        return GitBranchIcon;
      default:
        return BrainIcon;
    }
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case 'code_generator':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'infrastructure':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'learning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'status-online';
      case 'working':
        return 'status-info';
      case 'idle':
        return 'status-warning';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getAgentDescription = (type: string) => {
    switch (type) {
      case 'code_generator':
        return 'Generates complete project structures, files, and code using AI';
      case 'infrastructure':
        return 'Manages cloud infrastructure and Terraform deployments';
      case 'learning':
        return 'Analyzes code patterns and learns from repository changes';
      default:
        return 'Autonomous AI agent for software development tasks';
    }
  };

  if (error) {
    return (
      <div className="flex-1 p-6">
        <TopBar 
          title="Agents" 
          subtitle="Manage your autonomous AI agents"
        />
        <div className="mt-6">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">Error</Badge>
                <span className="text-red-800 dark:text-red-200">
                  Failed to load agents: {error.message}
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
        title="Agents" 
        subtitle="Manage your autonomous AI agents"
      />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <PlayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary dark:text-white">
                    {agents.filter(a => a.status === 'running' || a.status === 'working').length}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BrainIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary dark:text-white">
                    {agents.length}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary dark:text-white">
                    {agents.filter(a => a.status === 'working').length}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Working</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <BrainIcon className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
              No Agents Found
            </h3>
            <p className="text-slate-500 dark:text-slate-500">
              Agents should be automatically created when the system starts
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => {
              const AgentIcon = getAgentIcon(agent.type);
              const isActive = agent.status === 'running' || agent.status === 'working';
              
              return (
                <Card key={agent.id} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${getAgentColor(agent.type)}`}>
                          <AgentIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-secondary dark:text-white">
                              {agent.name}
                            </h3>
                            <Badge className={getStatusColor(agent.status)}>
                              {agent.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                            {getAgentDescription(agent.type)}
                          </p>
                          {agent.currentTask && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Current task:
                              </span>
                              <span className="text-xs font-medium text-secondary dark:text-white">
                                {agent.currentTask}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Progress:
                              </span>
                              <div className="w-32">
                                <Progress value={agent.progress || 0} className="h-2" />
                              </div>
                              <span className="text-xs font-medium text-secondary dark:text-white">
                                {agent.progress || 0}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              Updated {formatDistanceToNow(new Date(agent.updatedAt))} ago
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isActive ? (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => stopAgentMutation.mutate(agent.id)}
                            disabled={stopAgentMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <PauseIcon className="w-4 h-4 mr-1" />
                            {stopAgentMutation.isPending ? 'Stopping...' : 'Stop'}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => startAgentMutation.mutate(agent.id)}
                            disabled={startAgentMutation.isPending}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            {startAgentMutation.isPending ? 'Starting...' : 'Start'}
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <SettingsIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
