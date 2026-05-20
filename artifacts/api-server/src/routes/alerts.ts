import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, alertsTable, activityTable } from "@workspace/db";
import {
  ListAlertsQueryParams,
  ListAlertsResponse,
  CreateAlertBody,
  ResolveAlertParams,
  ResolveAlertResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const parsed = ListAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { severity, resolved } = parsed.data;
  const conditions = [];

  if (severity && severity !== "all") {
    conditions.push(eq(alertsTable.severity, severity));
  }
  if (resolved !== undefined) {
    conditions.push(eq(alertsTable.resolved, resolved));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select().from(alertsTable).where(where).orderBy(alertsTable.createdAt);

  const data = rows.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
  }));

  res.json(ListAlertsResponse.parse(data));
});

router.post("/alerts", async (req, res): Promise<void> => {
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [alert] = await db.insert(alertsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "alert_created",
    message: `Alert created: ${alert.title}`,
    severity: alert.severity,
    transactionId: alert.transactionId ?? null,
  });

  res.status(201).json({
    ...alert,
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: null,
  });
});

router.patch("/alerts/:id/resolve", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResolveAlertParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json(
    ResolveAlertResponse.parse({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
    })
  );
});

export default router;
