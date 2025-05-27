import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircleIcon, 
  FolderIcon, 
  BotIcon, 
  CloudIcon 
} from "lucide-react";

interface StatusCardsProps {
  stats: {
    system: { uptime: string; status: string };
    projects: { active: number };
    agents: { total: number; active: number };
    deployments: { count: number; issues: number };
  };
}

export function StatusCards({ stats }: StatusCardsProps) {
  const cards = [
    {
      title: "System Status",
      value: stats.system.uptime,
      label: "Uptime",
      icon: CheckCircleIcon,
      status: "Online",
      statusColor: "success"
    },
    {
      title: "Active Projects", 
      value: stats.projects.active.toString(),
      label: "Currently managed",
      icon: FolderIcon,
      status: "Active",
      statusColor: "info"
    },
    {
      title: "AI Agents",
      value: `${stats.agents.active}/${stats.agents.total}`,
      label: "Running agents",
      icon: BotIcon,
      status: "Learning",
      statusColor: "warning"
    },
    {
      title: "Deployments",
      value: stats.deployments.count.toString(),
      label: "Live environments",
      icon: CloudIcon,
      status: stats.deployments.issues > 0 ? `${stats.deployments.issues} Issues` : "Healthy",
      statusColor: stats.deployments.issues > 0 ? "error" : "success"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                card.statusColor === 'success' ? 'bg-green-100 dark:bg-green-900' :
                card.statusColor === 'info' ? 'bg-blue-100 dark:bg-blue-900' :
                card.statusColor === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                'bg-red-100 dark:bg-red-900'
              }`}>
                <card.icon className={`w-6 h-6 ${
                  card.statusColor === 'success' ? 'text-green-600 dark:text-green-400' :
                  card.statusColor === 'info' ? 'text-blue-600 dark:text-blue-400' :
                  card.statusColor === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <Badge className={`${
                card.statusColor === 'success' ? 'status-online' :
                card.statusColor === 'info' ? 'status-info' :
                card.statusColor === 'warning' ? 'status-warning' :
                'status-error'
              }`}>
                {card.status}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-secondary dark:text-white mb-1">
              {card.title}
            </h3>
            <p className="text-2xl font-bold text-secondary dark:text-white mb-1">
              {card.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
