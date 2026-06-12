import { access } from "node:fs/promises";
import { getChangeFilePath, getChangeScoresDir } from "../core/change.js";
import { readTextFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";
import { reviewSummarySchema } from "../schemas/review-summary.js";

const requiredArtifacts = ["clarification.md", "requirements.md", "design.md", "tasks.md"];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runStatus(cwd: string, changeName: string): Promise<string> {
  const metaPath = getChangeFilePath(cwd, changeName, "meta.json");
  const rawMeta = await readTextFile(metaPath);
  const meta = metaSchema.parse(JSON.parse(rawMeta));

  const missing: string[] = [];

  for (const artifact of requiredArtifacts) {
    if (!(await fileExists(getChangeFilePath(cwd, changeName, artifact)))) {
      missing.push(artifact);
    }
  }

  let nextStep: string;

  if (missing.includes("clarification.md")) {
    nextStep = `myspec clarify ${changeName}`;
  } else if (missing.length > 0) {
    nextStep = `myspec draft ${changeName}`;
  } else {
    const reviewSummaryPath = `${getChangeScoresDir(cwd, changeName)}/review-summary.json`;

    if (!(await fileExists(reviewSummaryPath))) {
      nextStep = `myspec review ${changeName}`;
    } else {
      const summary = reviewSummarySchema.parse(JSON.parse(await readTextFile(reviewSummaryPath)));
      nextStep = summary.pass ? `myspec apply ${changeName}` : summary.nextStep;
    }
  }

  return `status: ${meta.status}
missing: ${missing.join(", ") || "none"}
next: ${nextStep}`;
}
