import type { z } from "zod";
import { traceabilitySchema } from "../schemas/traceability.js";

type TraceabilityData = z.infer<typeof traceabilitySchema>;

export function checkTraceability(data: TraceabilityData) {
  const issues: Array<{ level: 3; title: string; suggestion: string }> = [];
  const gaps: string[] = [];

  for (const requirement of data.requirements) {
    if (requirement.tasks.length === 0) {
      gaps.push(`${requirement.id} missing TASK link`);
      issues.push({
        level: 3,
        title: `${requirement.id} has no linked task`,
        suggestion: `为 ${requirement.id} 补充至少一个 TASK。`,
      });
    }

    if (requirement.tests.length === 0) {
      gaps.push(`${requirement.id} missing TC link`);
      issues.push({
        level: 3,
        title: `${requirement.id} has no linked test`,
        suggestion: `为 ${requirement.id} 补充至少一个 TC。`,
      });
    }
  }

  return {
    pass: issues.length === 0,
    issues,
    gaps,
  };
}
