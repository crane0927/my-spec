import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";

describe("myspec propose", () => {
  it("creates a change directory with meta.json and proposal.md", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-propose-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");

    const meta = await readFile(
      join(root, ".myspec", "changes", "add-login", "meta.json"),
      "utf8",
    );

    expect(meta).toContain("\"mode\": \"standard\"");
  });
});
