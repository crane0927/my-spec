import { z } from "zod";

export const metaSchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  status: z.enum([
    "proposed",
    "clarifying",
    "drafted",
    "reviewing",
    "approved",
    "applying",
    "implemented",
    "verifying",
    "verified",
    "reported",
  ]),
  riskLevel: z.enum(["low", "medium", "high"]),
  createdAt: z.string().min(1),
});

export type Meta = z.infer<typeof metaSchema>;
