export function getDefaultReviewers(document: string): string[] {
  if (document === "proposal.md" || document === "requirements.md") {
    return ["Engineering Reviewer", "QA Reviewer"];
  }

  if (document === "design.md") {
    return ["Engineering Reviewer"];
  }

  if (document === "tasks.md" || document === "test-case.md") {
    return ["Engineering Reviewer", "QA Reviewer"];
  }

  return ["Engineering Reviewer"];
}
