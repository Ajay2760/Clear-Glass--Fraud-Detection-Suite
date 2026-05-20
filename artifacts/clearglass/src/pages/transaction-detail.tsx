import { useGetTransaction, useReviewTransaction, getGetTransactionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, CheckCircle2, Shield, Activity } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

export default function TransactionDetail({ id }: { id: number }) {
  const { data, isLoading } = useGetTransaction(id);
  const reviewTx = useReviewTransaction();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleReview = (status: 'confirmed' | 'cleared') => {
    reviewTx.mutate({ id, data: { reviewStatus: status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTransactionQueryKey(id) });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32 mb-8 bg-muted/20" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="col-span-1 md:col-span-2 h-[400px] bg-muted/20 rounded-xl" />
          <Skeleton className="h-[400px] bg-muted/20 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto text-center mt-20">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium">Transaction Not Found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/transactions">Return to monitor</Link>
        </Button>
      </div>
    );
  }

  const { transaction: tx, explanation } = data;
  
  const formattedFeatures = explanation.features.map(f => ({
    name: f.feature,
    value: Math.abs(f.contribution),
    raw: f.contribution,
    direction: f.direction,
    featureValue: f.value
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground mb-4 hover:text-foreground transition-colors w-fit">
        <Link href="/transactions" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          BACK TO STREAM
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight font-mono">TXN-{tx.id.toString().padStart(6, '0')}</h1>
            <Badge variant="outline" className={`font-mono uppercase ${
              tx.status === 'fraud' ? 'border-destructive text-destructive bg-destructive/10' :
              tx.status === 'review' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
              'border-primary text-primary bg-primary/10'
            }`}>
              {tx.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm font-mono">{format(new Date(tx.timestamp), "MMM d, yyyy HH:mm:ss 'UTC'")}</p>
        </div>

        {tx.status === 'review' && tx.reviewStatus === 'pending' && (
          <div className="flex items-center gap-3 bg-card/50 p-2 rounded-lg border border-border/50 backdrop-blur">
            <Button 
              variant="outline" 
              className="border-primary/50 text-primary hover:bg-primary/20 hover:text-primary"
              onClick={() => handleReview('cleared')}
              disabled={reviewTx.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              CLEAR
            </Button>
            <Button 
              variant="destructive"
              className="bg-destructive/20 text-destructive border border-destructive/50 hover:bg-destructive/40"
              onClick={() => handleReview('confirmed')}
              disabled={reviewTx.isPending}
            >
              <Shield className="w-4 h-4 mr-2" />
              CONFIRM FRAUD
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Transaction Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="text-4xl font-light tracking-tight text-foreground font-mono">
                  ${tx.amount.toFixed(2)}
                </p>
              </div>
              <div className="space-y-3">
                <InfoRow label="Merchant" value={tx.merchantName} />
                <InfoRow label="Category" value={tx.category} />
                <InfoRow label="Card" value={`•••• ${tx.cardLast4}`} mono />
                <InfoRow label="Location" value={`${tx.country} ${tx.ipAddress ? `(${tx.ipAddress})` : ''}`} />
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-muted-foreground mb-2 flex justify-between">
                  <span>Fraud Score</span>
                  <span className="font-mono text-foreground">{(tx.fraudScore * 100).toFixed(1)} / 100</span>
                </p>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${tx.fraudScore > 0.6 ? 'bg-destructive' : tx.fraudScore > 0.3 ? 'bg-amber-500' : 'bg-primary'}`} 
                    style={{ width: `${Math.max(tx.fraudScore * 100, 5)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Explainable AI */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  XAI Feature Contributions ({explanation.method})
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
                {explanation.summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedFeatures} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--foreground))" 
                      fontSize={11} 
                      fontFamily="monospace"
                      tickLine={false} 
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      formatter={(value: any, name: any, props: any) => [
                        `${(props.payload.raw * 100).toFixed(2)}% effect`, 
                        `Value: ${props.payload.featureValue}`
                      ]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {formattedFeatures.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.direction === 'positive' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-destructive"></div> Push towards Fraud
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-primary"></div> Push towards Legitimate
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}