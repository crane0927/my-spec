import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import {
  formatError,
  formatInfo,
  formatNextAction,
  formatSuccess,
  formatWarning,
} from "../src/core/output.js";

describe("cli output", () => {
  it("formats labeled output consistently", () => {
    expect(formatInfo("loading")).toBe("info: loading");
    expect(formatSuccess("done")).toBe("success: done");
    expect(formatError("failed")).toBe("error: failed");
  });
});

describe("enhanced cli output", () => {
  it("formats warning and next action messages", () => {
    expect(formatWarning("missing config")).toBe("warning: missing config");
    expect(formatNextAction("myspec review add-login")).toContain("next:");
  });
});

describe("published cli entry", () => {
  it("shows command list from the built cli entry", () => {
    const cliPath = resolve(process.cwd(), "dist/cli.js");
    const output = execFileSync("node", [cliPath, "--help"], {
      encoding: "utf8",
    });

    expect(output).toContain("init");
    expect(output).toContain("review");
    expect(output).toContain("status");
  });
});
