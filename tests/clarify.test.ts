import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runClarify } from "../src/commands/clarify.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";

describe("myspec clarify", () => {
  it("creates placeholder clarification.md when skip is enabled", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-clarify-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runClarify(root, "add-login", true);

    const content = await readFile(
      join(root, ".myspec", "changes", "add-login", "clarification.md"),
      "utf8",
    );

    expect(content).toContain("Skipped Clarification");
  });
});
