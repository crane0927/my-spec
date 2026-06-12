import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runApply } from "../src/commands/apply.js";
import { runClarify } from "../src/commands/clarify.js";
import { runDraft } from "../src/commands/draft.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runReview } from "../src/commands/review.js";

describe("myspec apply", () => {
  it("fails when review summary is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-apply-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");

    await expect(runApply(root, "add-login")).rejects.toThrow(/review/i);
  });

  it("loads apply context and updates meta status to applying", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-apply-success-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runClarify(root, "add-login", true);
    await runDraft(root, "add-login");
    await runReview(root, "add-login");

    const result = await runApply(root, "add-login");

    expect(result.status).toBe("applying");
    expect(result.context.requirements).toContain("# Requirements");
    expect(result.context.traceability).toContain("\"requirements\": []");

    const meta = await readFile(
      join(root, ".myspec", "changes", "add-login", "meta.json"),
      "utf8",
    );
    expect(meta).toContain('"status": "applying"');
  });
});
