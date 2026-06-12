import { describe, expect, it } from "vitest";
import { reviewResultSchema } from "../../src/schemas/review.js";

describe("reviewResultSchema", () => {
  it("accepts a valid review result", () => {
    const result = reviewResultSchema.parse({
      document: "requirements.md",
      reviewer: "Engineering Reviewer",
      overall: 88,
      pass: true,
      dimensionScores: {
        completeness: 90,
        testability: 86,
      },
      issues: [],
      blockingIssues: [],
    });

    expect(result.overall).toBe(88);
  });
});
