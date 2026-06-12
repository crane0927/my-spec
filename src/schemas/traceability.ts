import { z } from "zod";

export const traceabilityRequirementSchema = z.object({
  id: z.string().min(1),
  tasks: z.array(z.string().min(1)),
  tests: z.array(z.string().min(1)),
  status: z.string().min(1).optional(),
});

export const traceabilitySchema = z.object({
  requirements: z.array(traceabilityRequirementSchema),
  summary: z.record(z.string(), z.unknown()).optional(),
  gaps: z.array(z.unknown()).optional(),
});

export type TraceabilityRequirement = z.infer<typeof traceabilityRequirementSchema>;
export type Traceability = z.infer<typeof traceabilitySchema>;
