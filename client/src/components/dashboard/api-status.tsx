import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ApiEndpoint {
  name: string;
  method: string;
  status: "healthy" | "warning" | "error";
  responseTime: string;
}

interface ApiStatusProps {
  stats: {
    requests: number;
    successRate: string;
  };
}

export function ApiStatus({ stats }: ApiStatusProps) {
  const endpoints: ApiEndpoint[] = [
    { name: "/api/projects", method: "GET", status: "healthy", responseTime: "200ms avg" },
    { name: "/api/projects/create", method: "POST", status: "healthy", responseTime: "1.2s avg" },
    { name: "/api/agents/status", method: "GET", status: "healthy", responseTime: "150ms avg" },
    { name: "/api/terraform/deploy", method: "POST", status: "warning", responseTime: "45s avg" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500 dark:bg-green-600";
      case "warning":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "error":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
          REST API Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <div key={`${endpoint.method}-${endpoint.name}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className={`w-3 h-3 ${getStatusColor(endpoint.status)} rounded-full`} />
                <div>
                  <span className="font-medium text-secondary dark:text-white">
                    {endpoint.method} {endpoint.name}
                  </span>
                </div>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {endpoint.responseTime}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-500 dark:text-slate-400">Total Requests (24h)</span>
            <span className="font-semibold text-secondary dark:text-white">
              {stats.requests.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Success Rate</span>
            <Badge className="status-online">
              {stats.successRate}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
