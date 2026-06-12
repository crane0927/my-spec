import { z } from "zod";

export const traceabilityRequirementSchema = z.object({
  id: z.string().min(1),
  tasks: z.array(z.string().min(1)),
  tests: z.array(z.string().min(1)),
  status: z.string().min(1).optional(),
});

export const coverageSummarySchema = z.object({
  totalRequirements: z.number().int().nonnegative(),
  fullyCovered: z.number().int().nonnegative(),
  partiallyCovered: z.number().int().nonnegative(),
  uncovered: z.number().int().nonnegative(),
});

export const traceabilitySchema = z.object({
  requirements: z.array(traceabilityRequirementSchema),
  summary: coverageSummarySchema.optional(),
  gaps: z.array(z.unknown()).optional(),
});

export type TraceabilityRequirement = z.infer<typeof traceabilityRequirementSchema>;
export type CoverageSummary = z.infer<typeof coverageSummarySchema>;
export type Traceability = z.infer<typeof traceabilitySchema>;
