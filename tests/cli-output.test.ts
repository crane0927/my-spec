import { describe, expect, it } from "vitest";
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
