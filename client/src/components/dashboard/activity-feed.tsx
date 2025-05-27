import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CodeIcon, 
  RocketIcon, 
  GitBranchIcon, 
  AlertTriangleIcon 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: number;
  type: string;
  title: string;
  description?: string;
  status: string;
  createdAt: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_generated':
        return CodeIcon;
      case 'infrastructure_planned':
        return RocketIcon;
      case 'commits_analyzed':
        return GitBranchIcon;
      default:
        return AlertTriangleIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project_generated':
        return 'bg-green-500 dark:bg-green-600';
      case 'infrastructure_planned':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'commits_analyzed':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-red-500 dark:bg-red-600';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No recent activities
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary dark:text-white">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt))} ago
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
