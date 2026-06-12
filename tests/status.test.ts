import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runStatus } from "../src/commands/status.js";

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
});
