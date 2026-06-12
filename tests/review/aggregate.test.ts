import { describe, expect, it } from "vitest";
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
