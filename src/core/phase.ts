export function getReviewFallbackStep(document: string): string {
  if (document === "requirements.md") {
    return "返回 requirements 修订";
  }

  if (document === "design.md") {
    return "返回 design 修订";
  }

  if (document === "tasks.md") {
    return "返回 tasks 修订";
  }

  if (document === "test-case.md") {
    return "返回 test-case 修订";
  }

  return "返回 draft 修订";
}
