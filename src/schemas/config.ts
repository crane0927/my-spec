import { z } from "zod";

export const configSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
  }),
  workflow: z.object({
    allow_skip_clarification: z.boolean(),
  }),
});

export type MyspecConfig = z.infer<typeof configSchema>;
