import { useGetDashboardSummary, useGetFraudTrend, useGetCategoryBreakdown, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, ArrowUpRight, DollarSign, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: loadingTrends } = useGetFraudTrend();
  const { data: categories, isLoading: loadingCategories } = useGetCategoryBreakdown();
  const { data: activity, isLoading: loadingActivity } = useGetDashboardActivity({ limit: 10 });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono uppercase tracking-widest">Live Security Feed</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          SYSTEM NOMINAL
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Monitored"
          value={summary?.totalTransactions.toLocaleString() || "0"}
          icon={Activity}
          loading={loadingSummary}
          subtitle="24h Volume"
        />
        <KpiCard
          title="Fraud Rate"
          value={`${((summary?.fraudRate || 0) * 100).toFixed(2)}%`}
          icon={ShieldAlert}
          loading={loadingSummary}
          alert={(summary?.fraudRate || 0) > 0.05}
        />
        <KpiCard
          title="Amount at Risk"
          value={`$${(summary?.totalAmountAtRisk || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          loading={loadingSummary}
          alert={(summary?.totalAmountAtRisk || 0) > 10000}
        />
        <KpiCard
          title="Active Alerts"
          value={summary?.activeAlerts.toLocaleString() || "0"}
          icon={AlertTriangle}
          loading={loadingSummary}
          alert={(summary?.activeAlerts || 0) > 5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Detection Trend (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingTrends ? (
              <Skeleton className="w-full h-full bg-muted/20" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => format(new Date(val), "MMM d")} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                  />
                  <Area type="monotone" dataKey="fraudCount" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" />
                  <Area type="monotone" dataKey="legitimateCount" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorLegit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Risk by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingCategories ? (
              <Skeleton className="w-full h-full bg-muted/20" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                  />
                  <Bar dataKey="fraudCount" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
            <Link href="/alerts" className="text-xs text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted/20" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="mt-0.5">
                        {item.severity === 'critical' || item.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        ) : item.severity === 'medium' ? (
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{item.message}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.timestamp), "MMM d, HH:mm:ss")}</p>
                      </div>
                      {item.transactionId && (
                        <Link href={`/transactions/${item.transactionId}`} className="text-xs text-primary hover:underline font-mono">
                          TXN-{item.transactionId.toString().padStart(6, '0')}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-medium">SOC Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Timer className="w-4 h-4" /> Avg Turnaround</span>
                  <span className="font-mono">{summary?.investigationTurnaround.toFixed(1) || "-"} hrs</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(((summary?.investigationTurnaround || 0) / 24) * 100, 100)}%` }} />
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><ArrowUpRight className="w-4 h-4" /> Avg Fraud Score</span>
                  <span className="font-mono">{(summary?.avgFraudScore || 0).toFixed(3)}</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(summary?.avgFraudScore || 0) * 100}%` }} />
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, loading, alert, subtitle }: { title: string, value: string, icon: any, loading: boolean, alert?: boolean, subtitle?: string }) {
  return (
    <Card className={`relative overflow-hidden bg-card/50 backdrop-blur border-border/50 transition-all duration-300 hover:border-primary/30 group ${alert ? 'border-destructive/30 bg-destructive/5' : ''}`}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/10 rounded-bl-full pointer-events-none" />}
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted/20" />
            ) : (
              <p className={`text-3xl font-bold tracking-tight font-mono ${alert ? 'text-destructive' : 'text-foreground'}`}>
                {value}
              </p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl border ${alert ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/20 text-primary'}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}