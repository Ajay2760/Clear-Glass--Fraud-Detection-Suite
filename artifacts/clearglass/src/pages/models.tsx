import { useListModels, useGetModelMetrics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, CheckCircle2, AlertCircle, Network } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip as RechartsTooltip } from "recharts";
import { format } from "date-fns";
import infographicPath from "@assets/unnamed_1779259945830.png";

export default function Models() {
  const { data: models, isLoading: loadingModels } = useListModels();

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Performance</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono uppercase tracking-widest">Algorithm Evaluation Lab</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50 shadow-lg xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-medium flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              About the Technology
            </CardTitle>
            <CardDescription>Visual concepts behind our fraud detection systems and methodologies.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <img src={infographicPath} alt="Fraud Detection Systems, Models and Methodologies" className="max-h-[600px] rounded-lg border border-white/10 shadow-2xl" />
          </CardContent>
        </Card>

        {loadingModels ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-6 h-[400px]">
                <Skeleton className="w-full h-full bg-muted/20" />
              </CardContent>
            </Card>
          ))
        ) : models?.map(model => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: any }) {
  const { data: metrics, isLoading } = useGetModelMetrics(model.id);

  const radarData = metrics ? [
    { subject: 'Accuracy', value: metrics.accuracy * 100 },
    { subject: 'Precision', value: metrics.precision * 100 },
    { subject: 'Recall', value: metrics.recall * 100 },
    { subject: 'F1 Score', value: metrics.f1Score * 100 },
    { subject: 'AUC-ROC', value: metrics.aucRoc * 100 },
    { subject: 'PR-AUC', value: metrics.prAuc * 100 },
  ] : [];

  return (
    <Card className={`bg-card/50 backdrop-blur border-border/50 shadow-lg relative overflow-hidden transition-all duration-300 ${model.isActive ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}>
      {model.isActive && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none" />}
      <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className={`w-5 h-5 ${model.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <CardTitle className="text-xl font-medium">{model.name}</CardTitle>
          </div>
          <p className="text-sm font-mono text-muted-foreground">{model.type} • v{model.version}</p>
        </div>
        <Badge variant="outline" className={`font-mono text-xs uppercase ${model.isActive ? 'border-primary text-primary bg-primary/10' : 'border-muted text-muted-foreground bg-white/5'}`}>
          {model.isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
          {model.isActive ? 'Active Primary' : 'Shadow Mode'}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 h-[300px]">
            <Skeleton className="w-full h-full bg-white/5 rounded-xl" />
          </div>
        ) : metrics ? (
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 p-6 border-r border-border/50">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'monospace' }} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(val: number) => [`${val.toFixed(1)}%`]}
                    />
                    <Radar name="Metrics" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="w-full md:w-48 bg-black/20 p-6 flex flex-col justify-center space-y-4">
               <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">AUC-ROC</p>
                  <p className="text-2xl font-light text-foreground">{(metrics.aucRoc * 100).toFixed(1)}%</p>
               </div>
               <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">F1 Score</p>
                  <p className="text-2xl font-light text-foreground">{(metrics.f1Score * 100).toFixed(1)}%</p>
               </div>
               <div>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Trained</p>
                  <p className="text-sm font-medium text-foreground">{format(new Date(model.trainedAt), "MMM d, yyyy")}</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground h-[300px] flex items-center justify-center">
            Metrics unavailable
          </div>
        )}
      </CardContent>
    </Card>
  );
}