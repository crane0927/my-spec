import { z } from "zod";

export const reportSchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  status: z.string().min(1),
  verification: z.record(z.string(), z.unknown()),
  evidenceSummary: z.record(z.string(), z.unknown()),
});

export type Report = z.infer<typeof reportSchema>;
