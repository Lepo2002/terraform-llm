import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BrainIcon, 
  LayersIcon, 
  GitBranchIcon 
} from "lucide-react";

interface Agent {
  id: number;
  name: string;
  type: string;
  status: string;
  currentTask?: string;
  progress: number;
}

interface ActiveAgentsProps {
  agents: Agent[];
}

export function ActiveAgents({ agents }: ActiveAgentsProps) {
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
        return 'bg-green-500 dark:bg-green-600';
      case 'infrastructure':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'learning':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
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

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          Active Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No active agents
            </div>
          ) : (
            agents.map((agent) => {
              const Icon = getAgentIcon(agent.type);
              const colorClass = getAgentColor(agent.type);
              
              return (
                <div key={agent.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary dark:text-white">
                        {agent.name}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {agent.currentTask || 'Monitoring system'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                          agent.status === 'running' ? 'bg-green-500' :
                          agent.status === 'working' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        } ${agent.status === 'working' ? 'animate-pulse' : ''}`} />
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary dark:text-white">
                      {agent.progress}%
                    </p>
                    <div className="w-16 mt-1">
                      <Progress value={agent.progress} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
