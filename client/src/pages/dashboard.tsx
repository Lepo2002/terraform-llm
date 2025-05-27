import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/top-bar";
import { StatusCards } from "@/components/dashboard/status-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ActiveAgents } from "@/components/dashboard/active-agents";
import { ApiStatus } from "@/components/dashboard/api-status";
import { SystemLogs } from "@/components/dashboard/system-logs";
import { ProjectModal } from "@/components/projects/project-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    return (
      <div className="flex-1 p-6">
        <TopBar 
          title="Dashboard" 
          subtitle="Autonomous Software Development Platform"
          onCreateProject={() => setIsProjectModalOpen(true)}
          notificationCount={3}
        />
        <div className="mt-6">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">Error</Badge>
                <span className="text-red-800 dark:text-red-200">
                  Failed to load dashboard data: {error.message}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <TopBar 
          title="Dashboard" 
          subtitle="Autonomous Software Development Platform"
          onCreateProject={() => setIsProjectModalOpen(true)}
          notificationCount={0}
        />
        <div className="mt-6 space-y-8">
          {/* Status Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentActivities = [], activeAgents = [], systemLogs = [] } = dashboardData || {};

  return (
    <div className="flex-1">
      <TopBar 
        title="Dashboard" 
        subtitle="Autonomous Software Development Platform"
        onCreateProject={() => setIsProjectModalOpen(true)}
        notificationCount={3}
      />
      
      <div className="p-6 space-y-8">
        {/* System Status Cards */}
        {stats && <StatusCards stats={stats} />}

        {/* Recent Activity and Agent Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ActivityFeed activities={recentActivities} />
          <ActiveAgents agents={activeAgents} />
        </div>

        {/* Latest Generated Project */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
                Latest Generated Project
              </CardTitle>
              <Badge className="status-online">Just Created</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-secondary dark:text-white mb-4">
                  Project: E-commerce API
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Flask REST API with JWT authentication
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      PostgreSQL database with SQLAlchemy ORM
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Redis caching layer
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Docker containerization
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Terraform AWS deployment (in progress)
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-secondary dark:text-white mb-4">
                  Generated Code Structure
                </h4>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`ecommerce-api/
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── user.py
│   │   └── product.py
│   ├── routes/
│   │   ├── auth.py
│   │   └── products.py
│   └── utils/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── docker-compose.yml
├── Dockerfile
└── requirements.txt`}</pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Integration and Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {stats?.api && <ApiStatus stats={stats.api} />}
          <SystemLogs logs={systemLogs} />
        </div>
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
