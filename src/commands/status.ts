import { access } from "node:fs/promises";
import {
  getChangeFilePath,
  getChangeReportPath,
  getChangeScoresDir,
  getChangeVerificationFilePath,
} from "../core/change.js";
import { readTextFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";
import { reviewSummarySchema } from "../schemas/review-summary.js";

const requiredArtifactsByMode = {
  standard: ["clarification.md", "requirements.md", "design.md", "tasks.md"],
  lite: ["requirements.md", "tasks.md"],
} as const;

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
  const requiredArtifacts = requiredArtifactsByMode[meta.mode];

  const missing: string[] = [];

  for (const artifact of requiredArtifacts) {
    if (!(await fileExists(getChangeFilePath(cwd, changeName, artifact)))) {
      missing.push(artifact);
    }
  }

  let nextStep: string;

  if (meta.mode === "standard" && missing.includes("clarification.md")) {
    nextStep = `myspec clarify ${changeName}`;
  } else if (missing.length > 0) {
    nextStep = `myspec draft ${changeName}`;
  } else {
    const reviewSummaryPath = `${getChangeScoresDir(cwd, changeName)}/review-summary.json`;
    const verificationPath = getChangeVerificationFilePath(cwd, changeName, "verification.json");
    const reportPath = getChangeReportPath(cwd, changeName, "report.json");

    if (!(await fileExists(reviewSummaryPath))) {
      nextStep = `myspec review ${changeName}`;
    } else if (meta.status === "reported" && (await fileExists(reportPath))) {
      nextStep = "done";
    } else if (await fileExists(verificationPath)) {
      nextStep = `myspec report ${changeName}`;
    } else if (meta.status === "applying" || meta.status === "implemented" || meta.status === "verifying") {
      nextStep = `myspec verify ${changeName}`;
    } else {
      const summary = reviewSummarySchema.parse(JSON.parse(await readTextFile(reviewSummaryPath)));
      nextStep = summary.pass ? `myspec apply ${changeName}` : summary.nextStep;
    }
  }

  return `status: ${meta.status}
mode: ${meta.mode}
missing: ${missing.join(", ") || "none"}
next: ${nextStep}`;
}
