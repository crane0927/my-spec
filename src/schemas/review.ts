import { z } from "zod";

export const reviewIssueSchema = z.object({
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  suggestion: z.string().min(1),
});

export const reviewResultSchema = z.object({
  document: z.string().min(1),
  reviewer: z.string().min(1),
  overall: z.number().min(0).max(100),
  pass: z.boolean(),
  dimensionScores: z.record(z.string(), z.number().min(0).max(100)),
  issues: z.array(reviewIssueSchema),
  blockingIssues: z.array(reviewIssueSchema),
});

export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
