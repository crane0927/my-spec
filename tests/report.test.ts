import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDraft } from "../src/commands/draft.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runReport } from "../src/commands/report.js";
import { runReview } from "../src/commands/review.js";
import { ensureDir, writeJsonFile } from "../src/core/fs.js";

describe("myspec report", () => {
  it("writes report.md and report.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-report-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");
    await runReview(root, "add-login");
    await writeFile(
      join(root, ".myspec", "config.yaml"),
      `project:
  name: my-project
  type: generic

workflow:
  allow_skip_clarification: true

checks:
  commands:
    - id: smoke
      command: true
      required: true
`,
      "utf8",
    );
    await writeFile(
      join(root, ".myspec", "changes", "add-login", "traceability.json"),
      JSON.stringify(
        {
          requirements: [
            { id: "REQ-001", tasks: ["TASK-001"], tests: ["TC-001"] },
            { id: "REQ-002", tasks: [], tests: [] },
          ],
          summary: {
            totalRequirements: 2,
            fullyCovered: 1,
            partiallyCovered: 0,
            uncovered: 1,
          },
          gaps: ["REQ-002 missing TASK link", "REQ-002 missing TC link"],
        },
        null,
        2,
      ),
      "utf8",
    );
    await ensureDir(join(root, ".myspec", "changes", "add-login", "verification"));
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "verification", "verification.json"), {
      change: "add-login",
      status: "passed",
      gates: {
        testExecution: "passed",
      },
      issues: [],
      coverageSummary: {
        totalRequirements: 2,
        fullyCovered: 1,
        partiallyCovered: 0,
        uncovered: 1,
      },
    });
    await writeJsonFile(join(root, ".myspec", "changes", "add-login", "verification", "evidence.json"), {
      change: "add-login",
      items: [],
    });

    await runReport(root, "add-login");

    const report = await readFile(join(root, ".myspec", "changes", "add-login", "report.md"), "utf8");
    const reportJson = await readFile(
      join(root, ".myspec", "changes", "add-login", "report.json"),
      "utf8",
    );

    expect(report).toContain("# Report");
    expect(report).toContain("fullyCovered: 1");
    expect(reportJson).toContain('"status": "reported"');
    expect(reportJson).toContain('"coverageSummary"');
  });
});
