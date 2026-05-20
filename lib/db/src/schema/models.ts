import { pgTable, serial, text, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const modelsTable = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["XGBoost", "LightGBM", "CatBoost", "IsolationForest", "Ensemble"] }).notNull(),
  version: text("version").notNull().default("1.0.0"),
  isActive: boolean("is_active").notNull().default(true),
  trainedAt: timestamp("trained_at", { withTimezone: true }).notNull().defaultNow(),
  description: text("description"),
});

export const modelMetricsTable = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull(),
  accuracy: real("accuracy").notNull(),
  aucRoc: real("auc_roc").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  f1Score: real("f1_score").notNull(),
  prAuc: real("pr_auc").notNull(),
  tp: integer("tp").notNull().default(0),
  fp: integer("fp").notNull().default(0),
  tn: integer("tn").notNull().default(0),
  fn: integer("fn").notNull().default(0),
});

export const insertModelSchema = createInsertSchema(modelsTable).omit({ id: true });
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof modelsTable.$inferSelect;

export const insertModelMetricsSchema = createInsertSchema(modelMetricsTable).omit({ id: true });
export type InsertModelMetrics = z.infer<typeof insertModelMetricsSchema>;
export type ModelMetrics = typeof modelMetricsTable.$inferSelect;
