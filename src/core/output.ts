export function formatInfo(message: string): string {
  return `info: ${message}`;
}

export function formatSuccess(message: string): string {
  return `success: ${message}`;
}

export function formatError(message: string): string {
  return `error: ${message}`;
}

export function formatReviewSummary(summary: { pass: boolean; nextStep: string }): string {
  return `review: ${summary.pass ? "passed" : "failed"}\nnext: ${summary.nextStep}`;
}
