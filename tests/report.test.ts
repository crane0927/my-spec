import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDraft } from "../src/commands/draft.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runReport } from "../src/commands/report.js";
import { runReview } from "../src/commands/review.js";
import { runVerify } from "../src/commands/verify.js";

describe("myspec report", () => {
  it("writes report.md and report.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-report-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");
    await runReview(root, "add-login");
    await runVerify(root, "add-login");

    await runReport(root, "add-login");

    const report = await readFile(join(root, ".myspec", "changes", "add-login", "report.md"), "utf8");
    const reportJson = await readFile(
      join(root, ".myspec", "changes", "add-login", "report.json"),
      "utf8",
    );

    expect(report).toContain("# Report");
    expect(reportJson).toContain('"status": "reported"');
  });
});
