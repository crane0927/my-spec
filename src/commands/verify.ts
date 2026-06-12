import { updateChangeStatus } from "../apply/status-updater.js";
import { getChangeVerificationDir, getChangeVerificationFilePath } from "../core/change.js";
import { ensureDir, writeJsonFile } from "../core/fs.js";
import { runChecks } from "../verify/checks-runner.js";
import { buildEvidence } from "../verify/evidence-builder.js";
import { buildVerification } from "../verify/verification-builder.js";

export async function runVerify(root: string, changeName: string) {
  await updateChangeStatus(root, changeName, "verifying");
  const checks = await runChecks(root);
  const verification = buildVerification(changeName, checks);
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
