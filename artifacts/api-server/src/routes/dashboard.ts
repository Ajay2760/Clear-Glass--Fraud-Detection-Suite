import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, transactionsTable, alertsTable, activityTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardActivityQueryParams,
  GetDashboardActivityResponse,
  GetFraudTrendResponse,
  GetCategoryBreakdownResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      fraudCount: sql<number>`sum(case when status = 'fraud' then 1 else 0 end)::int`,
      totalAmount: sql<number>`sum(case when status = 'fraud' then amount::numeric else 0 end)::numeric`,
      avgScore: sql<number>`avg(fraud_score)::numeric`,
    })
    .from(transactionsTable);

  const [alertTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`sum(case when resolved = false then 1 else 0 end)::int`,
    })
    .from(alertsTable);

  const fraudCount = totals?.fraudCount ?? 0;
  const totalTx = totals?.total ?? 1;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalTransactions: totalTx,
      fraudDetected: fraudCount,
      totalAlerts: alertTotals?.total ?? 0,
      activeAlerts: alertTotals?.active ?? 0,
      fraudRate: totalTx > 0 ? Number((fraudCount / totalTx).toFixed(4)) : 0,
      avgFraudScore: Number(Number(totals?.avgScore ?? 0).toFixed(3)),
      investigationTurnaround: 4.2,
      totalAmountAtRisk: Number(Number(totals?.totalAmount ?? 0).toFixed(2)),
    })
  );
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const parsed = GetDashboardActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 10;
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(limit);

  const data = rows.map((a) => ({
    ...a,
    timestamp: a.timestamp.toISOString(),
  }));

  res.json(GetDashboardActivityResponse.parse(data));
});

router.get("/dashboard/fraud-trend", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      DATE(timestamp AT TIME ZONE 'UTC')::text as date,
      SUM(CASE WHEN status = 'fraud' THEN 1 ELSE 0 END)::int as "fraudCount",
      SUM(CASE WHEN status != 'fraud' THEN 1 ELSE 0 END)::int as "legitimateCount",
      SUM(amount::numeric)::numeric as "totalAmount"
    FROM transactions
    WHERE timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(timestamp AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `);

  const rowArr = (rows as unknown as { rows: Array<{ date: string; fraudCount: number; legitimateCount: number; totalAmount: string }> }).rows ?? rows;
  const data = (rowArr as Array<{ date: string; fraudCount: number; legitimateCount: number; totalAmount: string }>).map(
    (r) => ({
      date: r.date,
      fraudCount: r.fraudCount ?? 0,
      legitimateCount: r.legitimateCount ?? 0,
      totalAmount: Number(r.totalAmount ?? 0),
    })
  );

  res.json(GetFraudTrendResponse.parse(data));
});

router.get("/dashboard/category-breakdown", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      category,
      SUM(CASE WHEN status = 'fraud' THEN 1 ELSE 0 END)::int as "fraudCount",
      SUM(CASE WHEN status != 'fraud' THEN 1 ELSE 0 END)::int as "legitimateCount"
    FROM transactions
    GROUP BY category
    ORDER BY "fraudCount" DESC
  `);

  const catRowArr = (rows as unknown as { rows: Array<{ category: string; fraudCount: number; legitimateCount: number }> }).rows ?? rows;
  const data = (catRowArr as Array<{ category: string; fraudCount: number; legitimateCount: number }>).map((r) => ({
    category: r.category,
    fraudCount: r.fraudCount ?? 0,
    legitimateCount: r.legitimateCount ?? 0,
    fraudRate:
      r.fraudCount + r.legitimateCount > 0
        ? Number((r.fraudCount / (r.fraudCount + r.legitimateCount)).toFixed(4))
        : 0,
  }));

  res.json(GetCategoryBreakdownResponse.parse(data));
});

export default router;
