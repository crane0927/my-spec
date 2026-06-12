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

  it("does not require clarification or design artifacts for lite changes", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-status-lite-"));

    await runInit(root);
    await runPropose(root, "tiny-fix", "lite");
    await runDraft(root, "tiny-fix");

    const output = await runStatus(root, "tiny-fix");

    expect(output).toContain("missing: none");
    expect(output).toContain("next: myspec review tiny-fix");
  });

  it("shows fallback target when verification fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-status-fallback-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runClarify(root, "add-login", true);
    await runDraft(root, "add-login");
    await runReview(root, "add-login");
    await ensureDir(join(root, ".myspec", "changes", "add-login", "verification"));
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "meta.json"), {
      change: "add-login",
      mode: "standard",
      status: "implemented",
      riskLevel: "high",
      createdAt: "2026-06-12T00:00:00.000Z",
    });
    await writeJsonFile(
      join(root, ".myspec", "changes", "add-login", "verification", "verification.json"),
      {
        change: "add-login",
        status: "failed",
        gates: {
          testExecution: "failed",
        },
        issues: [],
        nextStep: "返回 apply 修复",
      },
    );

    const output = await runStatus(root, "add-login");

    expect(output).toContain("next: 返回 apply 修复");
  });

  it("suggests verify after apply, report after successful verify, and done after report", async () => {
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

    await ensureDir(join(root, ".myspec", "changes", "add-login", "verification"));
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "verification", "verification.json"), {
      change: "add-login",
      status: "passed",
      gates: {
        testExecution: "passed",
      },
      issues: [],
    });
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "verification", "evidence.json"), {
      change: "add-login",
      items: [],
    });
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "meta.json"), {
      change: "add-login",
      mode: "standard",
      status: "verified",
      riskLevel: "high",
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    const verifyOutput = await runStatus(root, "add-login");
    expect(verifyOutput).toContain("next: myspec report add-login");

    await runReport(root, "add-login");

    const reportOutput = await runStatus(root, "add-login");
    expect(reportOutput).toContain("next: done");
  });
});
