export function buildEvidence(changeName: string, checks: Array<{ id: string; exitCode: number }>) {
  return {
    change: changeName,
    items: checks.map((check, index) => ({
      id: `EV-${index + 1}`,
      type: "command" as const,
      relatedRequirements: [],
      relatedTasks: [],
      relatedTestCases: [],
      payload: {
        commandId: check.id,
        exitCode: check.exitCode,
      },
    })),
  };
}
