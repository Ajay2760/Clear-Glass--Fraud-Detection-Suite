import { useState } from "react";
import { useListSyntheticJobs, useCreateSyntheticJob, getListSyntheticJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Database, Plus, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  method: z.enum(['GAN', 'VAE', 'SMOTE', 'ADASYN', 'Faker']),
  rowCount: z.coerce.number().min(100).max(100000),
  fraudRate: z.coerce.number().min(0.001).max(0.5),
  notes: z.string().optional(),
});

export default function Synthetic() {
  const { data: jobs, isLoading } = useListSyntheticJobs();
  const createJob = useCreateSyntheticJob();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "SMOTE",
      rowCount: 10000,
      fraudRate: 0.05,
      notes: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createJob.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListSyntheticJobsQueryKey() });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'failed': return <XCircle className="w-3 h-3 mr-1" />;
      case 'running': return <RefreshCw className="w-3 h-3 mr-1 animate-spin" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'border-primary text-primary bg-primary/10';
      case 'failed': return 'border-destructive text-destructive bg-destructive/10';
      case 'running': return 'border-amber-500 text-amber-500 bg-amber-500/10';
      default: return 'border-muted text-muted-foreground bg-white/5';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Synthetic Data Lab</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono uppercase tracking-widest">Adversarial Generation</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs">
              <Plus className="w-4 h-4 mr-2" />
              NEW GENERATION JOB
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Configure Synthetic Data Job</DialogTitle>
              <DialogDescription>
                Generate artificial transaction sets for model training and edge-case testing.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generation Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20 border-white/10 font-mono">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SMOTE">SMOTE (Oversampling)</SelectItem>
                          <SelectItem value="ADASYN">ADASYN</SelectItem>
                          <SelectItem value="GAN">GAN (Generative Adversarial)</SelectItem>
                          <SelectItem value="VAE">VAE (Variational Autoencoder)</SelectItem>
                          <SelectItem value="Faker">Faker (Rules-based)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rowCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Row Count</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-black/20 border-white/10 font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fraudRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Fraud Rate (0-1)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="bg-black/20 border-white/10 font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Purpose of this dataset..." {...field} className="bg-black/20 border-white/10 font-mono resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createJob.isPending} className="w-full font-mono text-xs">
                    {createJob.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                    INITIATE GENERATION
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground">JOB ID</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">METHOD</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">CONFIG</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">CREATED</TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground">NOTES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell><Skeleton className="h-4 w-16 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-white/5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40 bg-white/5" /></TableCell>
                  </TableRow>
                ))
              ) : jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id} className="border-border/50 hover:bg-white/5">
                    <TableCell className="font-mono text-sm text-primary">
                      SYN-{job.id.toString().padStart(4, '0')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs uppercase border-white/20 bg-black/40">
                        {job.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm font-mono">
                        <span className="text-muted-foreground">Rows: <span className="text-foreground">{job.rowCount.toLocaleString()}</span></span>
                        <span className="text-muted-foreground">Fraud: <span className="text-foreground">{(job.fraudRate * 100).toFixed(1)}%</span></span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-xs uppercase ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {format(new Date(job.createdAt), "MMM d, HH:mm")}
                      {job.completedAt && <span className="block text-[10px] text-primary">Done: {format(new Date(job.completedAt), "HH:mm")}</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {job.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-20 mx-auto" />
                    <p>No synthetic data jobs found.</p>
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