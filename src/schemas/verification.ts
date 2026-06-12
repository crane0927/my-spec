import { z } from "zod";

export const verificationIssueSchema = z.object({
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.string().min(1),
  title: z.string().min(1),
  suggestion: z.string().min(1),
});

export const verificationSchema = z.object({
  change: z.string().min(1),
  status: z.enum(["passed", "failed"]),
  gates: z.record(z.string(), z.string()),
  issues: z.array(verificationIssueSchema),
  nextStep: z.string().min(1).optional(),
});

export type VerificationIssue = z.infer<typeof verificationIssueSchema>;
export type Verification = z.infer<typeof verificationSchema>;
