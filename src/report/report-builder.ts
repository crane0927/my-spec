type ReportVerification = {
  status: string;
  issues?: Array<{
    category: string;
    source: string;
    title: string;
    recommendedAction: string;
  }>;
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
  const issuesSection =
    verification.issues && verification.issues.length > 0
      ? `
## Issues

${verification.issues
  .map(
    (issue) =>
      `- title: ${issue.title}\n- category: ${issue.category}\n- source: ${issue.source}\n- recommendedAction: ${issue.recommendedAction}`,
  )
  .join("\n")}\n`
      : "";

  return `# Report

## Change

- name: ${changeName}

## Verification

- status: ${verification.status}
${coverageSection}${issuesSection}`;
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
