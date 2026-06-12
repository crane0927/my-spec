import { describe, expect, it } from "vitest";
import { aggregateReviewResults } from "../../src/review/aggregate.js";
import { buildReviewResult } from "../../src/review/scorecard.js";

describe("buildReviewResult", () => {
  it("builds a passing result when all dimension scores meet threshold", () => {
    const result = buildReviewResult({
      document: "requirements.md",
      reviewer: "Engineering Reviewer",
      dimensionScores: {
        completeness: 90,
        testability: 86,
      },
      issues: [],
    });

    expect(result.pass).toBe(true);
    expect(result.overall).toBe(88);
  });
});

describe("aggregateReviewResults", () => {
  it("fails when any document fails or has blocking issues", () => {
    const result = aggregateReviewResults({
      change: "add-login",
      mode: "standard",
      results: [
        {
          document: "requirements.md",
          reviewer: "Engineering Reviewer",
          overall: 78,
          pass: false,
          dimensionScores: { completeness: 78 },
          issues: [],
          blockingIssues: [],
        },
      ],
    });

    expect(result.pass).toBe(false);
    expect(result.nextStep).toContain("requirements");
  });
});
