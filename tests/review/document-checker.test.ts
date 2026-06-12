import { describe, expect, it } from "vitest";
import { checkDocuments } from "../../src/review/document-checker.js";
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

describe("checkDocuments", () => {
  it("flags missing documents for standard mode", async () => {
    const result = await checkDocuments({
      mode: "standard",
      files: new Map([["proposal.md", "# Proposal\n\n## Goals\n\n## Recommended Workflow Mode\n"]]),
    });

    expect(result.issues.some((issue) => issue.title.includes("Missing document"))).toBe(true);
  });

  it("does not require clarification or design for lite mode", async () => {
    const result = await checkDocuments({
      mode: "lite",
      files: new Map([
        ["proposal.md", "# Proposal\n\n## Goals\n\n## Recommended Workflow Mode\n"],
        ["requirements.md", "# Requirements\n\n## Requirements\n"],
        ["tasks.md", "# Tasks\n"],
        ["test-case.md", "# Test Cases\n"],
        ["test-case.json", "{\n  \"cases\": []\n}\n"],
        ["traceability.json", "{\n  \"requirements\": [],\n  \"summary\": {},\n  \"gaps\": []\n}\n"],
      ]),
    });

    expect(result.issues.some((issue) => issue.title.includes("clarification.md"))).toBe(false);
    expect(result.issues.some((issue) => issue.title.includes("design.md"))).toBe(false);
  });
});
