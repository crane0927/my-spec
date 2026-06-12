import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runClarify } from "../src/commands/clarify.js";
import { runDraft } from "../src/commands/draft.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runReport } from "../src/commands/report.js";
import { runReview } from "../src/commands/review.js";
import { runStatus } from "../src/commands/status.js";
import { runVerify } from "../src/commands/verify.js";
import { ensureDir, writeJsonFile } from "../src/core/fs.js";

describe("myspec status", () => {
  it("reports missing artifacts and next step", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-status-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");

    const output = await runStatus(root, "add-login");

    expect(output).toContain("missing:");
    expect(output).toContain("requirements.md");
    expect(output).toContain("next: myspec clarify add-login");
  });

  it("suggests apply when review summary passes", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-status-review-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runClarify(root, "add-login", true);
    await runDraft(root, "add-login");
    await ensureDir(join(root, ".myspec", "changes", "add-login", "scores"));
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "scores", "review-summary.json"), {
      change: "add-login",
      mode: "standard",
      pass: true,
      documents: [],
      blockingIssues: [],
      nextStep: "进入 apply",
    });

    const output = await runStatus(root, "add-login");

    expect(output).toContain("next: myspec apply add-login");
  });

  it("suggests verify after apply, report after verify, and done after report", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-status-phase3-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runClarify(root, "add-login", true);
    await runDraft(root, "add-login");
    await runReview(root, "add-login");

    const reviewOutput = await runStatus(root, "add-login");
    expect(reviewOutput).toContain("next: myspec apply add-login");

    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "meta.json"), {
      change: "add-login",
      mode: "standard",
      status: "applying",
      riskLevel: "high",
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    const applyOutput = await runStatus(root, "add-login");
    expect(applyOutput).toContain("next: myspec verify add-login");

    await runVerify(root, "add-login");

    const verifyOutput = await runStatus(root, "add-login");
    expect(verifyOutput).toContain("next: myspec report add-login");

    await runReport(root, "add-login");

    const reportOutput = await runStatus(root, "add-login");
    expect(reportOutput).toContain("next: done");
  });
});
