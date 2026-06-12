import { describe, expect, it } from "vitest";
import { runCommand } from "../../src/core/executor.js";

describe("runCommand", () => {
  it("captures stdout and exit code", async () => {
    const result = await runCommand("node -e \"console.log('ok')\"", process.cwd());

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });
});
