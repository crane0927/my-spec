import { join } from "node:path";
import { listChangeFiles, readChangeFile } from "../core/change.js";
import { ensureDir, writeJsonFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";
import { aggregateReviewResults } from "../review/aggregate.js";
import { checkDocuments } from "../review/document-checker.js";
import { buildReviewResult } from "../review/scorecard.js";

export async function runReview(cwd: string, changeName: string) {
  const meta = metaSchema.parse(JSON.parse(await readChangeFile(cwd, changeName, "meta.json")));
  const fileNames = await listChangeFiles(cwd, changeName);
  const files = new Map<string, string>();

  for (const fileName of fileNames) {
    if (fileName.endsWith(".md") || fileName.endsWith(".json")) {
      files.set(fileName, await readChangeFile(cwd, changeName, fileName));
    }
  }

  const documentCheck = await checkDocuments({ mode: meta.mode, files });
  const baseResult = buildReviewResult({
    document: "artifacts",
    reviewer: "Engineering Reviewer",
    dimensionScores: {
      completeness: documentCheck.issues.some((issue) => issue.level === 3) ? 40 : 90,
    },
    issues: documentCheck.issues.map((issue) => ({
      level: issue.level,
      category: "document-integrity",
      title: issue.title,
      suggestion: issue.suggestion,
    })),
  });

  const summary = aggregateReviewResults({
    change: changeName,
    mode: meta.mode,
    results: [baseResult],
  });

  const scoresDir = join(cwd, ".myspec", "changes", changeName, "scores");
  await ensureDir(scoresDir);
  await writeJsonFile(join(scoresDir, "artifacts.score.json"), baseResult);
  await writeJsonFile(join(scoresDir, "review-summary.json"), summary);

  return summary;
}
