import { z } from "zod";

export const reviewSummarySchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  pass: z.boolean(),
  documents: z.array(
    z.object({
      document: z.string().min(1),
      pass: z.boolean(),
      overall: z.number().min(0).max(100),
      reviewers: z.array(z.string().min(1)),
    }),
  ),
  blockingIssues: z.array(
    z.object({
      document: z.string().min(1),
      reviewer: z.string().min(1),
      title: z.string().min(1),
    }),
  ),
  nextStep: z.string().min(1),
});

export type ReviewSummary = z.infer<typeof reviewSummarySchema>;
