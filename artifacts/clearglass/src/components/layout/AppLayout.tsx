import { Link, useLocation } from "wouter";
import { Activity, AlertTriangle, Cpu, Database, LayoutDashboard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transaction Monitor", href: "/transactions", icon: Activity },
  { name: "Alert Center", href: "/alerts", icon: AlertTriangle },
  { name: "Model Performance", href: "/models", icon: Cpu },
  { name: "Synthetic Data Lab", href: "/synthetic", icon: Database },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 flex-col hidden md:flex border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-mono font-bold tracking-wider text-lg text-primary shadow-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]">
            CLEARGLASS
          </span>
        </div>
        <ScrollArea className="flex-1 py-6 px-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 mr-3 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
              <span className="text-xs font-mono text-muted-foreground">SO</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">System Ops</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background glow effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
