import type { ReviewIssue, ReviewResult } from "../schemas/review.js";

type BuildReviewResultInput = {
  document: string;
  reviewer: string;
  dimensionScores: Record<string, number>;
  issues: ReviewIssue[];
};

export function buildReviewResult(input: BuildReviewResultInput): ReviewResult {
  const scores = Object.values(input.dimensionScores);
  const overall =
    scores.length === 0
      ? 0
      : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const blockingIssues = input.issues.filter((issue) => issue.level === 3);
  const pass = blockingIssues.length === 0 && scores.every((score) => score >= 80);

  return {
    document: input.document,
    reviewer: input.reviewer,
    overall,
    pass,
    dimensionScores: input.dimensionScores,
    issues: input.issues,
    blockingIssues,
  };
}
