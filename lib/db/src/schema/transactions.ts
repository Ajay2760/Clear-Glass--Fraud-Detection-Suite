import { pgTable, serial, numeric, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  merchantName: text("merchant_name").notNull(),
  cardLast4: text("card_last4").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  fraudScore: real("fraud_score").notNull().default(0),
  status: text("status", { enum: ["fraud", "legitimate", "review"] }).notNull().default("legitimate"),
  reviewStatus: text("review_status", { enum: ["pending", "confirmed", "cleared"] }).notNull().default("pending"),
  country: text("country").notNull().default("US"),
  ipAddress: text("ip_address"),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
