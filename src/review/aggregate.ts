import { getReviewFallbackStep } from "../core/phase.js";
import type { ReviewResult } from "../schemas/review.js";

type AggregateReviewInput = {
  change: string;
  mode: "standard" | "lite";
  results: ReviewResult[];
};

export function aggregateReviewResults(input: AggregateReviewInput) {
  const grouped = new Map<string, ReviewResult[]>();

  for (const result of input.results) {
    grouped.set(result.document, [...(grouped.get(result.document) ?? []), result]);
  }

  const documents = [...grouped.entries()].map(([document, reviews]) => {
    const overall = Math.round(
      reviews.reduce((sum, review) => sum + review.overall, 0) / reviews.length,
    );
    const pass = reviews.every((review) => review.pass);

    return {
      document,
      pass,
      overall,
      reviewers: reviews.map((review) => review.reviewer),
    };
  });

  const firstFailedDocument = documents.find((document) => !document.pass);
  const blockingIssues = input.results.flatMap((result) =>
    result.blockingIssues.map((issue) => ({
      document: result.document,
      reviewer: result.reviewer,
      title: issue.title,
    })),
  );

  return {
    change: input.change,
    mode: input.mode,
    pass: documents.every((document) => document.pass) && blockingIssues.length === 0,
    documents,
    blockingIssues,
    nextStep: firstFailedDocument
      ? getReviewFallbackStep(firstFailedDocument.document)
      : "进入 apply",
  };
}
