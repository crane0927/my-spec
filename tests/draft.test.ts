import { access, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDraft } from "../src/commands/draft.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";

describe("myspec draft", () => {
  it("creates the standard document set for a change", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-draft-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");

    await access(join(root, ".myspec", "changes", "add-login", "requirements.md"));
    await access(join(root, ".myspec", "changes", "add-login", "traceability.json"));
  });

  it("skips clarification and design artifacts for lite mode", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-lite-draft-"));

    await runInit(root);
    await runPropose(root, "tiny-fix", "lite");
    await runDraft(root, "tiny-fix");

    await access(join(root, ".myspec", "changes", "tiny-fix", "requirements.md"));
    await expect(
      access(join(root, ".myspec", "changes", "tiny-fix", "design.md")),
    ).rejects.toThrow();
  });
});
