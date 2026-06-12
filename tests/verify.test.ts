import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDraft } from "../src/commands/draft.js";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runReview } from "../src/commands/review.js";
import { runVerify } from "../src/commands/verify.js";
import { configSchema } from "../src/schemas/config.js";
import { metaSchema } from "../src/schemas/meta.js";

describe("phase 3 schemas", () => {
  it("accepts applying and verified statuses", () => {
    const meta = metaSchema.parse({
      change: "add-login",
      mode: "standard",
      status: "verified",
      riskLevel: "high",
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    expect(meta.status).toBe("verified");
  });

  it("accepts checks command configuration", () => {
    const config = configSchema.parse({
      project: { name: "my-project", type: "generic" },
      workflow: { allow_skip_clarification: true },
      checks: {
        commands: [{ id: "test", command: "npm test", required: true }],
      },
    });

    expect(config.checks.commands[0].id).toBe("test");
  });
});

describe("myspec verify", () => {
  it("writes checks, verification and evidence artifacts", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-verify-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");
    await runReview(root, "add-login");

    await runVerify(root, "add-login");

    const verification = await readFile(
      join(root, ".myspec", "changes", "add-login", "verification", "verification.json"),
      "utf8",
    );
    const checks = await readFile(
      join(root, ".myspec", "changes", "add-login", "verification", "checks.json"),
      "utf8",
    );
    const evidence = await readFile(
      join(root, ".myspec", "changes", "add-login", "verification", "evidence.json"),
      "utf8",
    );

    expect(verification).toContain('"change": "add-login"');
    expect(checks).toContain('"results"');
    expect(evidence).toContain('"items"');
  });
});
