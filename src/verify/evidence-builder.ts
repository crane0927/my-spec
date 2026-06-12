import type { Evidence, EvidenceItem } from "../schemas/evidence.js";

export function buildEvidence(
  changeName: string,
  checks: Array<{ id: string; exitCode: number }>,
  extras: {
    manualChecks?: Array<{ title: string; result: string }>;
    acceptedRisks?: Array<{ title: string; reason: string }>;
  } = {},
): Evidence {
  const items: EvidenceItem[] = checks.map((check, index) => ({
    id: `EV-${index + 1}`,
    type: "command",
    relatedRequirements: [],
    relatedTasks: [],
    relatedTestCases: [],
    payload: {
      commandId: check.id,
      exitCode: check.exitCode,
    },
  }));

  for (const manualCheck of extras.manualChecks ?? []) {
    items.push({
      id: `EV-M-${items.length + 1}`,
      type: "manual-check",
      relatedRequirements: [],
      relatedTasks: [],
      relatedTestCases: [],
      payload: manualCheck,
    });
  }

  for (const risk of extras.acceptedRisks ?? []) {
    items.push({
      id: `EV-R-${items.length + 1}`,
      type: "risk-acceptance",
      relatedRequirements: [],
      relatedTasks: [],
      relatedTestCases: [],
      payload: risk,
    });
  }

  return {
    change: changeName,
    items,
  };
}
