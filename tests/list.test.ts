import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runList } from "../src/commands/list.js";
import { runPropose } from "../src/commands/propose.js";

describe("myspec list", () => {
  it("shows created changes with mode and status", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-list-"));

    await runInit(root);
    await runPropose(root, "add-login", "standard");

    const output = await runList(root);

    expect(output).toContain("add-login");
    expect(output).toContain("standard");
    expect(output).toContain("proposed");
  });
});
