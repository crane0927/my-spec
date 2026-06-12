import { updateChangeStatus } from "../apply/status-updater.js";
import {
  getChangeVerificationDir,
  getChangeVerificationFilePath,
  readChangeFile,
} from "../core/change.js";
import { ensureDir, writeJsonFile } from "../core/fs.js";
import { traceabilitySchema } from "../schemas/traceability.js";
import { runChecks } from "../verify/checks-runner.js";
import { buildEvidence } from "../verify/evidence-builder.js";
import { buildVerification } from "../verify/verification-builder.js";
import { checkTraceability } from "../review/traceability-checker.js";

export async function runVerify(root: string, changeName: string) {
  await updateChangeStatus(root, changeName, "verifying");
  const checks = await runChecks(root);
  const traceability = traceabilitySchema.parse(
    JSON.parse(await readChangeFile(root, changeName, "traceability.json")),
  );
  const traceabilityResult = checkTraceability(traceability);
  const verification = buildVerification(changeName, checks, {
    coverageSummary: traceabilityResult.summary,
  });
  const evidence = buildEvidence(changeName, checks);

  const verificationDir = getChangeVerificationDir(root, changeName);
  await ensureDir(verificationDir);
  await writeJsonFile(getChangeVerificationFilePath(root, changeName, "checks.json"), {
    change: changeName,
    results: checks,
  });
  await writeJsonFile(
    getChangeVerificationFilePath(root, changeName, "verification.json"),
    verification,
  );
  await writeJsonFile(getChangeVerificationFilePath(root, changeName, "evidence.json"), evidence);

  await updateChangeStatus(
    root,
    changeName,
    verification.status === "passed" ? "verified" : "implemented",
  );

  return { checks, verification, evidence };
}
