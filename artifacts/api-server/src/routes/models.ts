import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, modelsTable, modelMetricsTable } from "@workspace/db";
import {
  ListModelsResponse,
  GetModelMetricsParams,
  GetModelMetricsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/models", async (_req, res): Promise<void> => {
  const rows = await db.select().from(modelsTable).orderBy(modelsTable.id);
  const data = rows.map((m) => ({
    ...m,
    trainedAt: m.trainedAt.toISOString(),
    description: m.description ?? undefined,
  }));
  res.json(ListModelsResponse.parse(data));
});

router.get("/models/:id/metrics", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetModelMetricsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [metrics] = await db
    .select()
    .from(modelMetricsTable)
    .where(eq(modelMetricsTable.modelId, params.data.id));

  if (!metrics) {
    res.status(404).json({ error: "Model metrics not found" });
    return;
  }

  res.json(
    GetModelMetricsResponse.parse({
      modelId: metrics.modelId,
      accuracy: metrics.accuracy,
      aucRoc: metrics.aucRoc,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      prAuc: metrics.prAuc,
      confusionMatrix: {
        tp: metrics.tp,
        fp: metrics.fp,
        tn: metrics.tn,
        fn: metrics.fn,
      },
    })
  );
});

export default router;
