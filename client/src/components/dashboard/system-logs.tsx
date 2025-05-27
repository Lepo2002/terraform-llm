import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SystemLog {
  id: number;
  level: string;
  message: string;
  source?: string;
  createdAt: Date;
}

interface SystemLogsProps {
  logs: SystemLog[];
}

export function SystemLogs({ logs }: SystemLogsProps) {
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'status-online';
      case 'warn':
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      case 'debug':
        return 'status-info';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            System Logs
          </CardTitle>
          <Button variant="outline" size="sm" className="text-primary hover:text-blue-700">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No recent logs
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3">
                <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 w-16">
                  {formatTime(new Date(log.createdAt))}
                </span>
                <Badge className={getLevelColor(log.level)}>
                  {log.level.toUpperCase()}
                </Badge>
                <span className="text-slate-600 dark:text-slate-300 flex-1">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
