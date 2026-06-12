type ReportVerification = {
  status: string;
  coverageSummary?: {
    totalRequirements: number;
    fullyCovered: number;
    partiallyCovered: number;
    uncovered: number;
  };
};

export function buildReportMarkdown(changeName: string, verification: ReportVerification): string {
  const coverageSummary = verification.coverageSummary;
  const coverageSection = coverageSummary
    ? `
## Coverage Summary

- totalRequirements: ${coverageSummary.totalRequirements}
- fullyCovered: ${coverageSummary.fullyCovered}
- partiallyCovered: ${coverageSummary.partiallyCovered}
- uncovered: ${coverageSummary.uncovered}
`
    : "";

  return `# Report

## Change

- name: ${changeName}

## Verification

- status: ${verification.status}
${coverageSection}`;
}

export function buildReportJson(
  changeName: string,
  mode: "standard" | "lite",
  verification: ReportVerification,
  evidence: unknown,
) {
  return {
    change: changeName,
    mode,
    status: "reported",
    verification,
    coverageSummary: verification.coverageSummary,
    evidenceSummary: evidence,
  };
}
