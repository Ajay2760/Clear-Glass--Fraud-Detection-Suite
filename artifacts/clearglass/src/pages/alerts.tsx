import { useListAlerts, useResolveAlert, getListAlertsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertTriangle, Check, ShieldAlert, AlertCircle, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Alerts() {
  const { data: alerts, isLoading } = useListAlerts({ resolved: false });
  const resolveMutation = useResolveAlert();
  const queryClient = useQueryClient();

  const handleResolve = (id: number) => {
    resolveMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey({ resolved: false }) });
      }
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <ShieldAlert className="w-4 h-4 text-destructive" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-chart-4" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'border-destructive text-destructive bg-destructive/10';
      case 'high': return 'border-amber-500 text-amber-500 bg-amber-500/10';
      case 'medium': return 'border-chart-4 text-chart-4 bg-chart-4/10';
      default: return 'border-primary text-primary bg-primary/10';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive">Alert Center</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono uppercase tracking-widest">Active System Notifications</p>
        </div>
        <Badge variant="outline" className="font-mono bg-destructive/10 text-destructive border-destructive/20 py-1.5 px-3">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>
          {alerts?.length || 0} ACTIVE ALERTS
        </Badge>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg border-t-destructive/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground w-12"></TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">SEVERITY</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">DETAILS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">RELATED TXN</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">CREATED</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-4 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-64 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 bg-white/5 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : alerts && alerts.length > 0 ? (
                alerts.map((alert) => (
                  <TableRow key={alert.id} className="border-border/50 hover:bg-white/5 group transition-colors">
                    <TableCell>
                      {getSeverityIcon(alert.severity)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium text-foreground">{alert.title}</span>
                        <span className="text-sm text-muted-foreground">{alert.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.transactionId ? (
                        <Link href={`/transactions/${alert.transactionId}`} className="text-sm font-mono text-primary hover:underline">
                          TXN-{alert.transactionId.toString().padStart(6, '0')}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm font-mono">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolveMutation.isPending}
                        className="bg-black/20 border-white/10 hover:bg-primary/20 hover:text-primary transition-colors text-xs font-mono"
                      >
                        <Check className="w-3 h-3 mr-1.5" />
                        RESOLVE
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                      <p>No active alerts. System is nominal.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}