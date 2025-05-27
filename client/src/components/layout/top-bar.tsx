import { Button } from "@/components/ui/button";
import { BellIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onCreateProject?: () => void;
  notificationCount?: number;
}

export function TopBar({ title, subtitle, onCreateProject, notificationCount = 0 }: TopBarProps) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary dark:text-white">{title}</h2>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            <BellIcon className="w-5 h-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
              >
                {notificationCount}
              </Badge>
            )}
          </button>
          {onCreateProject && (
            <Button onClick={onCreateProject} className="bg-primary hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
