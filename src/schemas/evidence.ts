import { z } from "zod";

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["command", "test", "file"]),
  relatedRequirements: z.array(z.string()).default([]),
  relatedTasks: z.array(z.string()).default([]),
  relatedTestCases: z.array(z.string()).default([]),
  payload: z.record(z.string(), z.unknown()),
});

export const evidenceSchema = z.object({
  change: z.string().min(1),
  items: z.array(evidenceItemSchema),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
