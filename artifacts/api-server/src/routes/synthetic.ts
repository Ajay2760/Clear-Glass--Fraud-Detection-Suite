import { Router, type IRouter } from "express";
import { db, syntheticJobsTable, activityTable } from "@workspace/db";
import { ListSyntheticJobsResponse, CreateSyntheticJobBody } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

function simulateJobCompletion(jobId: number, method: string) {
  const delay = method === "GAN" || method === "VAE" ? 8000 : 3000;
  setTimeout(async () => {
    try {
      const [updated] = await db
        .update(syntheticJobsTable)
        .set({ status: "running" })
        .where(eq(syntheticJobsTable.id, jobId))
        .returning();

      if (!updated) return;

      setTimeout(async () => {
        const { eq } = await import("drizzle-orm");
        await db
          .update(syntheticJobsTable)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(syntheticJobsTable.id, jobId));

        await db.insert(activityTable).values({
          type: "synthetic_completed",
          message: `Synthetic data job #${jobId} (${method}) completed`,
          severity: "info",
        });
      }, delay * 2);
    } catch {}
  }, delay);
}

import { eq } from "drizzle-orm";

router.get("/synthetic/jobs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(syntheticJobsTable).orderBy(desc(syntheticJobsTable.createdAt));
  const data = rows.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    completedAt: j.completedAt ? j.completedAt.toISOString() : null,
    notes: j.notes ?? null,
  }));
  res.json(ListSyntheticJobsResponse.parse(data));
});

router.post("/synthetic/jobs", async (req, res): Promise<void> => {
  const parsed = CreateSyntheticJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db
    .insert(syntheticJobsTable)
    .values({
      method: parsed.data.method,
      rowCount: parsed.data.rowCount,
      fraudRate: parsed.data.fraudRate,
      status: "queued",
      notes: parsed.data.notes ?? null,
    })
    .returning();

  simulateJobCompletion(job.id, job.method);

  res.status(201).json({
    ...job,
    createdAt: job.createdAt.toISOString(),
    completedAt: null,
    notes: job.notes ?? null,
  });
});

export default router;
