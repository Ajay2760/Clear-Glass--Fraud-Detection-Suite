import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syntheticJobsTable = pgTable("synthetic_jobs", {
  id: serial("id").primaryKey(),
  method: text("method", { enum: ["GAN", "VAE", "SMOTE", "ADASYN", "Faker"] }).notNull(),
  rowCount: integer("row_count").notNull(),
  fraudRate: real("fraud_rate").notNull(),
  status: text("status", { enum: ["queued", "running", "completed", "failed"] }).notNull().default("queued"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
});

export const insertSyntheticJobSchema = createInsertSchema(syntheticJobsTable).omit({ id: true, createdAt: true });
export type InsertSyntheticJob = z.infer<typeof insertSyntheticJobSchema>;
export type SyntheticJob = typeof syntheticJobsTable.$inferSelect;
