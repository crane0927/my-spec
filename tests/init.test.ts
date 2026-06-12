import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";

describe("myspec init", () => {
  it("creates the .myspec directory with default config", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-init-"));

    await runInit(root);

    const config = await readFile(join(root, ".myspec", "config.yaml"), "utf8");
    expect(config).toContain("project:");
  });
});
