import { z } from "zod";

import { coverageSummarySchema } from "./traceability.js";

export const reportSchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  status: z.string().min(1),
  verification: z.record(z.string(), z.unknown()),
  coverageSummary: coverageSummarySchema.optional(),
  evidenceSummary: z.record(z.string(), z.unknown()),
});

export type Report = z.infer<typeof reportSchema>;
