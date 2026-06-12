import { getChangeFilePath, getChangeScoresDir } from "../core/change.js";
import { readTextFile } from "../core/fs.js";
import { reviewSummarySchema } from "../schemas/review-summary.js";

const requiredFiles = [
  "proposal.md",
  "clarification.md",
  "requirements.md",
  "design.md",
  "tasks.md",
  "test-case.md",
  "test-case.json",
  "traceability.json",
] as const;

export async function assertCanApply(root: string, changeName: string): Promise<void> {
  const summaryPath = getChangeFilePath(root, changeName, "scores/review-summary.json");
  const summary = reviewSummarySchema.parse(JSON.parse(await readTextFile(summaryPath)));

  if (!summary.pass) {
    throw new Error(`review not passed: ${summary.nextStep}`);
  }

  for (const fileName of requiredFiles) {
    await readTextFile(getChangeFilePath(root, changeName, fileName));
  }
}
