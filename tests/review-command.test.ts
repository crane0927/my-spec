import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runReview } from "../src/commands/review.js";

describe("myspec review", () => {
  it("returns a failed summary and writes score artifacts when required documents are missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-review-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");

    const summary = await runReview(root, "add-login");

    expect(summary.pass).toBe(false);
    expect(summary.nextStep).toBe("返回 draft 修订");

    await access(join(root, ".myspec", "changes", "add-login", "scores", "artifacts.score.json"));

    const summaryContent = await readFile(
      join(root, ".myspec", "changes", "add-login", "scores", "review-summary.json"),
      "utf8",
    );

    expect(summaryContent).toContain('"pass": false');
  });
});
