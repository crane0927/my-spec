import { z } from "zod";
import { coverageSummarySchema } from "./traceability.js";

export const verificationIssueSchema = z.object({
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.string().min(1),
  source: z.enum(["checks", "traceability", "evidence", "robustness", "security"]),
  title: z.string().min(1),
  suggestion: z.string().min(1),
  recommendedAction: z.enum(["fix-now", "document-risk", "defer-with-approval"]),
});

export const verificationSchema = z.object({
  change: z.string().min(1),
  status: z.enum(["passed", "failed"]),
  gates: z.record(z.string(), z.string()),
  issues: z.array(verificationIssueSchema),
  nextStep: z.string().min(1).optional(),
  coverageSummary: coverageSummarySchema.optional(),
});

export type VerificationIssue = z.infer<typeof verificationIssueSchema>;
export type Verification = z.infer<typeof verificationSchema>;
