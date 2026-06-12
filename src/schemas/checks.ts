import { z } from "zod";

export const checkCommandConfigSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  required: z.boolean(),
});

export const checkResultSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  required: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  passed: z.boolean(),
});

export const checksFileSchema = z.object({
  change: z.string().min(1),
  results: z.array(checkResultSchema),
});

export type CheckCommandConfig = z.infer<typeof checkCommandConfigSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type ChecksFile = z.infer<typeof checksFileSchema>;
