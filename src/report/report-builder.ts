export function buildReportMarkdown(changeName: string, verificationStatus: string): string {
  return `# Report

## Change

- name: ${changeName}

## Verification

- status: ${verificationStatus}
`;
}

export function buildReportJson(
  changeName: string,
  mode: "standard" | "lite",
  verification: unknown,
  evidence: unknown,
) {
  return {
    change: changeName,
    mode,
    status: "reported",
    verification,
    evidenceSummary: evidence,
  };
}
