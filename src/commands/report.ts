import { updateChangeStatus } from "../apply/status-updater.js";
import { getChangeReportPath, getChangeVerificationFilePath, readChangeFile } from "../core/change.js";
import { readTextFile, writeJsonFile, writeTextFile } from "../core/fs.js";
import { buildReportJson, buildReportMarkdown } from "../report/report-builder.js";
import { metaSchema } from "../schemas/meta.js";

export async function runReport(root: string, changeName: string) {
  const meta = metaSchema.parse(JSON.parse(await readChangeFile(root, changeName, "meta.json")));
  const verification = JSON.parse(
    await readTextFile(getChangeVerificationFilePath(root, changeName, "verification.json")),
  );
  const evidence = JSON.parse(
    await readTextFile(getChangeVerificationFilePath(root, changeName, "evidence.json")),
  );

  const reportMd = buildReportMarkdown(changeName, verification);
  const reportJson = buildReportJson(changeName, meta.mode, verification, evidence);

  await writeTextFile(getChangeReportPath(root, changeName, "report.md"), reportMd);
  await writeJsonFile(getChangeReportPath(root, changeName, "report.json"), reportJson);
  await updateChangeStatus(root, changeName, "reported");

  return reportJson;
}
