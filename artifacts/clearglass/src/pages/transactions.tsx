import { useState } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, SlidersHorizontal, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  
  const { data, isLoading } = useListTransactions({ page, limit: 20, status: status as any });

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Monitor</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono uppercase tracking-widest">Real-time analysis stream</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg">
        <div className="p-4 border-b border-border/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search merchant or card..." className="pl-9 bg-black/20 border-white/10 w-full font-mono text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-black/20 border-white/10 font-mono text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL STATUSES</SelectItem>
                <SelectItem value="fraud">FRAUD</SelectItem>
                <SelectItem value="legitimate">LEGITIMATE</SelectItem>
                <SelectItem value="review">REVIEW</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="bg-black/20 border-white/10">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">ID</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">TIMESTAMP</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">MERCHANT</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right">AMOUNT</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">SCORE</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-16 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-white/5 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 bg-white/5 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((tx) => (
                  <TableRow key={tx.id} className="border-border/50 hover:bg-white/5 group transition-colors">
                    <TableCell className="font-mono text-sm">
                      <Link href={`/transactions/${tx.id}`} className="text-primary hover:underline">
                        {tx.id.toString().padStart(6, '0')}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tx.timestamp), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{tx.merchantName}</span>
                        <span className="text-xs text-muted-foreground font-mono">•••• {tx.cardLast4}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs w-8">{(tx.fraudScore * 100).toFixed(0)}</span>
                        <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tx.fraudScore > 0.6 ? 'bg-destructive' : tx.fraudScore > 0.3 ? 'bg-amber-500' : 'bg-primary'}`} 
                            style={{ width: `${Math.max(tx.fraudScore * 100, 5)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-xs uppercase ${
                        tx.status === 'fraud' ? 'border-destructive text-destructive bg-destructive/10' :
                        tx.status === 'review' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                        'border-primary text-primary bg-primary/10'
                      }`}>
                        {tx.status === 'fraud' ? <AlertCircle className="w-3 h-3 mr-1" /> :
                         tx.status === 'review' ? <Clock className="w-3 h-3 mr-1" /> :
                         <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link href={`/transactions/${tx.id}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No transactions found for the selected criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {data && data.total > 20 && (
          <div className="p-4 border-t border-border/50 flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">
              Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="bg-black/20 font-mono text-xs">PREV</Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)} className="bg-black/20 font-mono text-xs">NEXT</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}