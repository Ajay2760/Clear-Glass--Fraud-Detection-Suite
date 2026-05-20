import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { db, transactionsTable, activityTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
  ReviewTransactionParams,
  ReviewTransactionBody,
  ReviewTransactionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeFraudScore(data: {
  amount: number;
  category: string;
  country: string;
}): number {
  let score = Math.random() * 0.3;
  if (Number(data.amount) > 5000) score += 0.3;
  if (Number(data.amount) > 10000) score += 0.2;
  if (["Cryptocurrency", "Wire Transfer", "Gift Cards"].includes(data.category)) score += 0.2;
  if (!["US", "GB", "CA", "AU", "DE", "FR"].includes(data.country)) score += 0.15;
  return Math.min(score, 0.99);
}

function scoreToStatus(score: number): "fraud" | "legitimate" | "review" {
  if (score >= 0.7) return "fraud";
  if (score >= 0.4) return "review";
  return "legitimate";
}

function generateExplanation(tx: {
  amount: string | number;
  fraudScore: number;
  category: string;
  country: string;
  merchantName: string;
}) {
  const features = [
    {
      feature: "Transaction Amount",
      value: `$${Number(tx.amount).toFixed(2)}`,
      contribution: Number(tx.amount) > 5000 ? 0.28 : 0.05,
      direction: Number(tx.amount) > 5000 ? "positive" : "negative",
    },
    {
      feature: "Merchant Category",
      value: tx.category,
      contribution: ["Cryptocurrency", "Wire Transfer"].includes(tx.category) ? 0.22 : 0.04,
      direction: ["Cryptocurrency", "Wire Transfer"].includes(tx.category) ? "positive" : "negative",
    },
    {
      feature: "Country of Origin",
      value: tx.country,
      contribution: !["US", "GB", "CA", "AU"].includes(tx.country) ? 0.18 : 0.02,
      direction: !["US", "GB", "CA", "AU"].includes(tx.country) ? "positive" : "negative",
    },
    {
      feature: "Transaction Velocity",
      value: "Normal",
      contribution: 0.06,
      direction: "negative" as const,
    },
    {
      feature: "Time of Day",
      value: new Date().getHours() < 6 || new Date().getHours() > 22 ? "Off-hours" : "Business hours",
      contribution: new Date().getHours() < 6 || new Date().getHours() > 22 ? 0.12 : 0.02,
      direction: new Date().getHours() < 6 || new Date().getHours() > 22 ? "positive" : "negative",
    },
    {
      feature: "Merchant Reputation",
      value: tx.merchantName,
      contribution: 0.03,
      direction: "negative" as const,
    },
  ];

  const summary =
    tx.fraudScore >= 0.7
      ? `High fraud probability detected. Primary risk factors: unusual transaction amount and merchant category.`
      : tx.fraudScore >= 0.4
        ? `Moderate risk detected. Transaction flagged for manual review.`
        : `Low fraud probability. Transaction appears legitimate.`;

  return { method: "SHAP" as const, summary, features };
}

router.get("/transactions", async (req, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, status, minAmount, maxAmount } = parsed.data;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(transactionsTable.status, status));
  }
  if (minAmount != null) {
    conditions.push(gte(transactionsTable.amount, String(minAmount)));
  }
  if (maxAmount != null) {
    conditions.push(lte(transactionsTable.amount, String(maxAmount)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(where),
    db
      .select()
      .from(transactionsTable)
      .where(where)
      .orderBy(desc(transactionsTable.timestamp))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const total = countResult[0]?.count ?? 0;

  const data = rows.map((t) => ({
    ...t,
    amount: Number(t.amount),
    timestamp: t.timestamp.toISOString(),
  }));

  res.json(ListTransactionsResponse.parse({ data, total, page, limit }));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, category, merchantName, cardLast4, country, ipAddress } = parsed.data;
  const fraudScore = computeFraudScore({ amount, category, country });
  const status = scoreToStatus(fraudScore);

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      amount: String(amount),
      category,
      merchantName,
      cardLast4,
      country,
      ipAddress: ipAddress ?? null,
      fraudScore,
      status,
      reviewStatus: "pending",
    })
    .returning();

  if (status === "fraud") {
    await db.insert(activityTable).values({
      type: "fraud_detected",
      message: `Fraud detected: ${merchantName} $${amount.toFixed(2)}`,
      severity: "critical",
      transactionId: tx.id,
    });
  }

  res.status(201).json(
    GetTransactionResponse.parse({
      transaction: { ...tx, amount: Number(tx.amount), timestamp: tx.timestamp.toISOString() },
      explanation: generateExplanation({ ...tx, amount: tx.amount }),
    })
  );
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTransactionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const result = { ...tx, amount: Number(tx.amount), timestamp: tx.timestamp.toISOString() };
  res.json(
    GetTransactionResponse.parse({
      transaction: result,
      explanation: generateExplanation(result),
    })
  );
});

router.patch("/transactions/:id/review", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReviewTransactionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ReviewTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const newStatus = body.data.reviewStatus === "cleared" ? "legitimate" : "fraud";

  const [tx] = await db
    .update(transactionsTable)
    .set({ reviewStatus: body.data.reviewStatus, status: newStatus })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (body.data.reviewStatus === "cleared") {
    await db.insert(activityTable).values({
      type: "transaction_cleared",
      message: `Transaction #${tx.id} cleared by analyst`,
      severity: "info",
      transactionId: tx.id,
    });
  }

  res.json(ReviewTransactionResponse.parse({ ...tx, amount: Number(tx.amount), timestamp: tx.timestamp.toISOString() }));
});

export default router;
