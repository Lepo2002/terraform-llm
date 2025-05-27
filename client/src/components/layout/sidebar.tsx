import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FolderIcon, 
  ChartLineIcon, 
  UsersIcon, 
  LayersIcon, 
  RocketIcon, 
  BarChart3Icon, 
  GitBranchIcon, 
  CodeIcon, 
  FileTextIcon,
  SettingsIcon,
  UserIcon,
  BotIcon
} from "lucide-react";

const navigation = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: ChartLineIcon },
      { name: "Projects", href: "/projects", icon: FolderIcon },
      { name: "Agents", href: "/agents", icon: UsersIcon },
    ]
  },
  {
    title: "Infrastructure", 
    items: [
      { name: "Terraform", href: "/terraform", icon: LayersIcon },
      { name: "Deployments", href: "/deployments", icon: RocketIcon },
      { name: "Monitoring", href: "/monitoring", icon: BarChart3Icon },
    ]
  },
  {
    title: "Development",
    items: [
      { name: "Git Integration", href: "/git", icon: GitBranchIcon },
      { name: "API Explorer", href: "/api", icon: CodeIcon },
      { name: "Logs", href: "/logs", icon: FileTextIcon },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm lg:relative lg:z-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary dark:text-white">LLM DevOps Agent</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">v1.0.0-beta</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6 flex-1">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location === item.href || 
                  (item.href === "/dashboard" && location === "/");
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-white" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                      {item.name === "Projects" && (
                        <span className="ml-auto bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs">
                          12
                        </span>
                      )}
                      {item.name === "Agents" && (
                        <span className="ml-auto bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                          3
                        </span>
                      )}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
