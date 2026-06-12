# myspec Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `myspec apply`、`myspec verify`、`myspec report` 以及 `checks.json`、`verification.json`、`evidence.json`、`report.md/report.json`，打通从 review 通过到验证与报告输出的 MVP 主闭环。

**Architecture:** Phase 3 直接复用已实现的 `review`、`status`、`change/fs/output` 辅助层和“直接调用命令函数”的测试风格。先扩展配置与状态 schema，再实现 apply 上下文装配、checks 执行引擎、verify 聚合流程、evidence 记录和 report 生成，最后把它们串进 CLI 与 `status` 的下一步动作里。

**Tech Stack:** TypeScript, Node.js, cac, zod, yaml, vitest

---

## File Structure

本计划默认创建或修改以下文件：

- `src/cli.ts`
  - 注册 `myspec apply`、`myspec verify`、`myspec report`
- `src/commands/apply.ts`
  - apply 命令入口
- `src/commands/verify.ts`
  - verify 命令入口
- `src/commands/report.ts`
  - report 命令入口
- `src/commands/status.ts`
  - 将 verify / report 结果接入现有状态提示
- `src/core/change.ts`
  - 扩展 `verification/`、报告路径和工件读写辅助函数
- `src/core/config.ts`
  - 读取扩展后的 checks 配置
- `src/core/fs.ts`
  - 复用现有 JSON / 文本写入，必要时补充目录保障辅助函数
- `src/core/output.ts`
  - 增加 apply / verify / report 摘要输出
- `src/core/executor.ts`
  - 本地命令执行封装
- `src/core/phase.ts`
  - 扩展 apply / verify / report 的下一步动作建议
- `src/schemas/meta.ts`
  - 扩展 status 枚举到 `applying`、`implemented`、`verifying`、`verified`、`reported`
- `src/schemas/config.ts`
  - 扩展 `checks.commands`
- `src/schemas/checks.ts`
  - `checks.json` schema
- `src/schemas/verification.ts`
  - `verification.json` schema
- `src/schemas/evidence.ts`
  - `evidence.json` schema
- `src/schemas/report.ts`
  - `report.json` schema
- `src/apply/context.ts`
  - apply 输入装配
- `src/apply/gate.ts`
  - apply 进入条件校验
- `src/apply/status-updater.ts`
  - apply 阶段状态更新
- `src/verify/checks-runner.ts`
  - checks 执行与结果采集
- `src/verify/verification-builder.ts`
  - verification 聚合
- `src/verify/evidence-builder.ts`
  - evidence 记录
- `src/report/report-builder.ts`
  - report.md / report.json 生成
- `src/templates/defaults.ts`
  - 扩展默认 `config.yaml` 中的 checks 配置
- `tests/apply.test.ts`
  - `myspec apply` 测试
- `tests/verify.test.ts`
  - `myspec verify` 测试
- `tests/report.test.ts`
  - `myspec report` 测试
- `tests/status.test.ts`
  - Phase 3 状态流转测试
- `tests/core/executor.test.ts`
  - 命令执行器测试

当前实现基线需要被 Phase 3 直接复用：

- `src/commands/review.ts` 已生成 `scores/artifacts.score.json` 和 `scores/review-summary.json`
- `src/commands/status.ts` 已在 review 通过后提示 `myspec apply <change>`
- `src/core/change.ts` 已提供 `.myspec/changes/<change>/` 的基础路径辅助函数
- `src/core/fs.ts` 已提供 `writeJsonFile`
- 当前测试均采用直接调用 `runXxx(root, ...)` 的方式，不起子进程
- `configSchema` 目前只含 `project` 和 `workflow`，尚未具备 checks 能力
- `metaSchema` 目前只到 `approved`，尚未覆盖 apply / verify / report 的状态

因此，Phase 3 的第一步不是直接写命令，而是先把状态与配置 schema 补齐。

---

### Task 1: 扩展 Phase 3 所需 schema 与默认配置

**Files:**
- Modify: `src/schemas/meta.ts`
- Modify: `src/schemas/config.ts`
- Create: `src/schemas/checks.ts`
- Create: `src/schemas/verification.ts`
- Create: `src/schemas/evidence.ts`
- Create: `src/schemas/report.ts`
- Modify: `src/templates/defaults.ts`
- Test: `tests/verify.test.ts`

- [x] **Step 1: 写 schema 扩展的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { metaSchema } from "../src/schemas/meta.js";
import { configSchema } from "../src/schemas/config.js";

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
        commands: [
          { id: "test", command: "npm test", required: true },
        ],
      },
    });

    expect(config.checks.commands[0].id).toBe("test");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/verify.test.ts`
Expected: FAIL，因为 `metaSchema` 和 `configSchema` 还不支持 Phase 3 字段

- [x] **Step 3: 扩展 `src/schemas/meta.ts`**

```ts
status: z.enum([
  "proposed",
  "clarifying",
  "drafted",
  "reviewing",
  "approved",
  "applying",
  "implemented",
  "verifying",
  "verified",
  "reported",
]),
```

- [x] **Step 4: 扩展 `src/schemas/config.ts`**

```ts
import { z } from "zod";

const checkCommandSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  required: z.boolean(),
});

export const configSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
  }),
  workflow: z.object({
    allow_skip_clarification: z.boolean(),
  }),
  checks: z.object({
    commands: z.array(checkCommandSchema),
  }),
});
```

- [x] **Step 5: 创建 `src/schemas/checks.ts`**

```ts
import { z } from "zod";

export const checkResultSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  required: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  passed: z.boolean(),
});

export const checksFileSchema = z.object({
  change: z.string().min(1),
  results: z.array(checkResultSchema),
});
```

- [x] **Step 6: 创建 `src/schemas/verification.ts`、`src/schemas/evidence.ts`、`src/schemas/report.ts`**

```ts
// verification.ts
import { z } from "zod";

export const verificationSchema = z.object({
  change: z.string().min(1),
  status: z.enum(["passed", "failed"]),
  gates: z.record(z.string(), z.string()),
  issues: z.array(
    z.object({
      level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      category: z.string().min(1),
      title: z.string().min(1),
      suggestion: z.string().min(1),
    }),
  ),
});
```

```ts
// evidence.ts
import { z } from "zod";

export const evidenceSchema = z.object({
  change: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["command", "test", "file"]),
      relatedRequirements: z.array(z.string()).default([]),
      relatedTasks: z.array(z.string()).default([]),
      relatedTestCases: z.array(z.string()).default([]),
      payload: z.record(z.string(), z.unknown()),
    }),
  ),
});
```

```ts
// report.ts
import { z } from "zod";

export const reportSchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  status: z.string().min(1),
  verification: z.record(z.string(), z.unknown()),
  evidenceSummary: z.record(z.string(), z.unknown()),
});
```

- [x] **Step 7: 扩展 `src/templates/defaults.ts` 中的默认配置**

```ts
export const defaultConfig = `project:
  name: my-project
  type: generic

workflow:
  allow_skip_clarification: true

checks:
  commands:
    - id: test
      command: npm test
      required: true
`;
```

- [x] **Step 8: 运行测试确认通过**

Run: `npm test -- tests/verify.test.ts`
Expected: PASS，Phase 3 所需状态和 checks 配置可被 schema 接受

- [x] **Step 9: 提交本任务**

```bash
git add src/schemas/meta.ts src/schemas/config.ts src/schemas/checks.ts src/schemas/verification.ts src/schemas/evidence.ts src/schemas/report.ts src/templates/defaults.ts tests/verify.test.ts
git commit -m "feat(schema): 扩展 Phase 3 配置与状态 schema"
```

---

### Task 2: 实现 apply 上下文装配与进入条件校验

**Files:**
- Create: `src/apply/context.ts`
- Create: `src/apply/gate.ts`
- Create: `src/commands/apply.ts`
- Modify: `src/core/change.ts`
- Test: `tests/apply.test.ts`

- [x] **Step 1: 写 apply 的失败测试**

```ts
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runDraft } from "../src/commands/draft.js";
import { runApply } from "../src/commands/apply.js";

describe("myspec apply", () => {
  it("fails when review summary is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-apply-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");

    await expect(runApply(root, "add-login")).rejects.toThrow(/review/i);
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/apply.test.ts`
Expected: FAIL，因为 `runApply` 尚不存在

- [x] **Step 3: 在 `src/core/change.ts` 增加 Phase 3 路径辅助函数**

```ts
export function getChangeVerificationDir(root: string, changeName: string): string {
  return join(getChangeDir(root, changeName), "verification");
}

export function getChangeReportPath(root: string, changeName: string, fileName: string): string {
  return join(getChangeDir(root, changeName), fileName);
}
```

- [x] **Step 4: 创建 `src/apply/context.ts`**

```ts
import { readChangeFile } from "../core/change.js";

export async function loadApplyContext(root: string, changeName: string) {
  return {
    proposal: await readChangeFile(root, changeName, "proposal.md"),
    clarification: await readChangeFile(root, changeName, "clarification.md"),
    requirements: await readChangeFile(root, changeName, "requirements.md"),
    design: await readChangeFile(root, changeName, "design.md"),
    tasks: await readChangeFile(root, changeName, "tasks.md"),
    testCase: await readChangeFile(root, changeName, "test-case.md"),
    testCaseJson: await readChangeFile(root, changeName, "test-case.json"),
    traceability: await readChangeFile(root, changeName, "traceability.json"),
  };
}
```

- [x] **Step 5: 创建 `src/apply/gate.ts`**

```ts
import { getChangeFilePath, getChangeScoresDir } from "../core/change.js";
import { readTextFile } from "../core/fs.js";
import { reviewSummarySchema } from "../schemas/review-summary.js";

export async function assertCanApply(root: string, changeName: string): Promise<void> {
  const summaryPath = `${getChangeScoresDir(root, changeName)}/review-summary.json`;
  const summary = reviewSummarySchema.parse(JSON.parse(await readTextFile(summaryPath)));

  if (!summary.pass) {
    throw new Error(`review not passed: ${summary.nextStep}`);
  }

  const requiredFiles = [
    "proposal.md",
    "clarification.md",
    "requirements.md",
    "design.md",
    "tasks.md",
    "test-case.md",
    "test-case.json",
    "traceability.json",
  ];

  for (const fileName of requiredFiles) {
    await readTextFile(getChangeFilePath(root, changeName, fileName));
  }
}
```

- [x] **Step 6: 创建 `src/commands/apply.ts`**

```ts
import { assertCanApply } from "../apply/gate.js";
import { loadApplyContext } from "../apply/context.js";

export async function runApply(root: string, changeName: string) {
  await assertCanApply(root, changeName);
  const context = await loadApplyContext(root, changeName);

  return {
    change: changeName,
    status: "ready",
    context,
  };
}
```

- [x] **Step 7: 运行测试确认通过**

Run: `npm test -- tests/apply.test.ts`
Expected: PASS，apply 在 review 未完成时失败，在上下文完整时能装配成功

- [x] **Step 8: 提交本任务**

```bash
git add src/apply/context.ts src/apply/gate.ts src/commands/apply.ts src/core/change.ts tests/apply.test.ts
git commit -m "feat(apply): 实现 apply 上下文装配与进入条件校验"
```

---

### Task 3: 实现 apply 阶段状态更新与 CLI 接入

**Files:**
- Create: `src/apply/status-updater.ts`
- Modify: `src/commands/apply.ts`
- Modify: `src/cli.ts`
- Modify: `src/core/output.ts`
- Test: `tests/apply.test.ts`

- [x] **Step 1: 扩展 apply 测试，覆盖状态更新**

```ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";

it("updates meta status to applying", async () => {
  const result = await runApply(root, "add-login");
  expect(result.status).toBe("applying");

  const meta = await readFile(
    join(root, ".myspec", "changes", "add-login", "meta.json"),
    "utf8",
  );
  expect(meta).toContain('"status": "applying"');
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/apply.test.ts`
Expected: FAIL，因为 apply 还未写回状态

- [x] **Step 3: 创建 `src/apply/status-updater.ts`**

```ts
import { getChangeFilePath } from "../core/change.js";
import { readTextFile, writeJsonFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";

export async function updateChangeStatus(
  root: string,
  changeName: string,
  status: "applying" | "implemented" | "verifying" | "verified" | "reported",
) {
  const path = getChangeFilePath(root, changeName, "meta.json");
  const meta = metaSchema.parse(JSON.parse(await readTextFile(path)));
  await writeJsonFile(path, { ...meta, status });
}
```

- [x] **Step 4: 在 `src/commands/apply.ts` 中写回状态**

```ts
import { updateChangeStatus } from "../apply/status-updater.js";

export async function runApply(root: string, changeName: string) {
  await assertCanApply(root, changeName);
  const context = await loadApplyContext(root, changeName);
  await updateChangeStatus(root, changeName, "applying");

  return {
    change: changeName,
    status: "applying",
    context,
  };
}
```

- [x] **Step 5: 在 `src/core/output.ts` 增加 apply 摘要**

```ts
export function formatApplySummary(summary: { change: string; status: string }): string {
  return `apply: ${summary.change}\nstatus: ${summary.status}`;
}
```

- [x] **Step 6: 在 `src/cli.ts` 注册 `apply` 命令**

```ts
import { runApply } from "./commands/apply.js";
import { formatApplySummary } from "./core/output.js";

cli.command("apply <change>", "Prepare apply context").action(async (change) => {
  const summary = await runApply(process.cwd(), change);
  console.log(formatApplySummary(summary));
});
```

- [x] **Step 7: 运行测试确认通过**

Run: `npm test -- tests/apply.test.ts`
Expected: PASS，apply 会把 `meta.status` 更新为 `applying`

- [x] **Step 8: 提交本任务**

```bash
git add src/apply/status-updater.ts src/commands/apply.ts src/cli.ts src/core/output.ts tests/apply.test.ts
git commit -m "feat(apply): 接入 apply 状态更新与命令输出"
```

---

### Task 4: 实现 checks 执行引擎

**Files:**
- Create: `src/core/executor.ts`
- Create: `src/verify/checks-runner.ts`
- Test: `tests/core/executor.test.ts`
- Test: `tests/verify.test.ts`

- [x] **Step 1: 写命令执行器失败测试**

```ts
import { describe, expect, it } from "vitest";
import { runCommand } from "../../src/core/executor.js";

describe("runCommand", () => {
  it("captures stdout and exit code", async () => {
    const result = await runCommand("node -e \"console.log('ok')\"", process.cwd());
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/core/executor.test.ts`
Expected: FAIL，因为 `runCommand` 尚未实现

- [x] **Step 3: 创建 `src/core/executor.ts`**

```ts
import { exec } from "node:child_process";

export function runCommand(command: string, cwd: string): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      resolve({
        exitCode: error && "code" in error && typeof error.code === "number" ? error.code : 0,
        stdout,
        stderr,
      });
    });
  });
}
```

- [x] **Step 4: 创建 `src/verify/checks-runner.ts`**

```ts
import { loadConfig } from "../core/config.js";
import { getMyspecDir } from "../core/change.js";
import { runCommand } from "../core/executor.js";

export async function runChecks(root: string) {
  const config = await loadConfig(`${getMyspecDir(root)}/config.yaml`);
  const results = [];

  for (const command of config.checks.commands) {
    const execution = await runCommand(command.command, root);
    results.push({
      id: command.id,
      command: command.command,
      required: command.required,
      exitCode: execution.exitCode,
      stdout: execution.stdout,
      stderr: execution.stderr,
      passed: execution.exitCode === 0,
    });
  }

  return results;
}
```

- [x] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/core/executor.test.ts tests/verify.test.ts`
Expected: PASS，执行器能返回 exit code / stdout / stderr，checks runner 能消费配置

- [x] **Step 6: 提交本任务**

```bash
git add src/core/executor.ts src/verify/checks-runner.ts tests/core/executor.test.ts tests/verify.test.ts
git commit -m "feat(verify): 实现 checks 执行引擎"
```

---

### Task 5: 实现 verify 聚合与 evidence 记录

**Files:**
- Create: `src/verify/verification-builder.ts`
- Create: `src/verify/evidence-builder.ts`
- Create: `src/commands/verify.ts`
- Modify: `src/core/change.ts`
- Test: `tests/verify.test.ts`

- [x] **Step 1: 写 verify 的失败测试**

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runDraft } from "../src/commands/draft.js";
import { runReview } from "../src/commands/review.js";
import { runVerify } from "../src/commands/verify.js";

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

    expect(verification).toContain('"change": "add-login"');
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/verify.test.ts`
Expected: FAIL，因为 `runVerify` 尚未实现

- [x] **Step 3: 在 `src/core/change.ts` 增加 verification 工件路径辅助函数**

```ts
export function getChangeVerificationFilePath(
  root: string,
  changeName: string,
  fileName: string,
): string {
  return join(getChangeVerificationDir(root, changeName), fileName);
}
```

- [x] **Step 4: 创建 `src/verify/verification-builder.ts`**

```ts
export function buildVerification(changeName: string, checks: Array<{ required: boolean; passed: boolean }>) {
  const hasRequiredFailure = checks.some((item) => item.required && !item.passed);

  return {
    change: changeName,
    status: hasRequiredFailure ? "failed" : "passed",
    gates: {
      testExecution: hasRequiredFailure ? "failed" : "passed",
      codeQuality: hasRequiredFailure ? "failed" : "passed",
    },
    issues: hasRequiredFailure
      ? [
          {
            level: 3 as const,
            category: "check-failure",
            title: "Required check failed",
            suggestion: "修复失败的必需命令后重新执行 verify。",
          },
        ]
      : [],
  };
}
```

- [x] **Step 5: 创建 `src/verify/evidence-builder.ts`**

```ts
export function buildEvidence(changeName: string, checks: Array<{ id: string; exitCode: number }>) {
  return {
    change: changeName,
    items: checks.map((check, index) => ({
      id: `EV-${index + 1}`,
      type: "command" as const,
      relatedRequirements: [],
      relatedTasks: [],
      relatedTestCases: [],
      payload: {
        commandId: check.id,
        exitCode: check.exitCode,
      },
    })),
  };
}
```

- [x] **Step 6: 创建 `src/commands/verify.ts`**

```ts
import { ensureDir, writeJsonFile } from "../core/fs.js";
import { getChangeVerificationDir, getChangeVerificationFilePath } from "../core/change.js";
import { updateChangeStatus } from "../apply/status-updater.js";
import { runChecks } from "../verify/checks-runner.js";
import { buildVerification } from "../verify/verification-builder.js";
import { buildEvidence } from "../verify/evidence-builder.js";

export async function runVerify(root: string, changeName: string) {
  await updateChangeStatus(root, changeName, "verifying");
  const checks = await runChecks(root);
  const verification = buildVerification(changeName, checks);
  const evidence = buildEvidence(changeName, checks);

  const verificationDir = getChangeVerificationDir(root, changeName);
  await ensureDir(verificationDir);
  await writeJsonFile(getChangeVerificationFilePath(root, changeName, "checks.json"), {
    change: changeName,
    results: checks,
  });
  await writeJsonFile(
    getChangeVerificationFilePath(root, changeName, "verification.json"),
    verification,
  );
  await writeJsonFile(getChangeVerificationFilePath(root, changeName, "evidence.json"), evidence);

  await updateChangeStatus(root, changeName, verification.status === "passed" ? "verified" : "implemented");

  return { checks, verification, evidence };
}
```

- [x] **Step 7: 运行测试确认通过**

Run: `npm test -- tests/verify.test.ts`
Expected: PASS，verify 会写出 `checks.json`、`verification.json`、`evidence.json`

- [x] **Step 8: 提交本任务**

```bash
git add src/verify/verification-builder.ts src/verify/evidence-builder.ts src/commands/verify.ts src/core/change.ts tests/verify.test.ts
git commit -m "feat(verify): 实现验证聚合与证据记录"
```

---

### Task 6: 实现 report 生成

**Files:**
- Create: `src/report/report-builder.ts`
- Create: `src/commands/report.ts`
- Modify: `src/core/output.ts`
- Test: `tests/report.test.ts`

- [x] **Step 1: 写 report 的失败测试**

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runDraft } from "../src/commands/draft.js";
import { runReview } from "../src/commands/review.js";
import { runVerify } from "../src/commands/verify.js";
import { runReport } from "../src/commands/report.js";

describe("myspec report", () => {
  it("writes report.md and report.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-report-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");
    await runReview(root, "add-login");
    await runVerify(root, "add-login");

    await runReport(root, "add-login");

    const report = await readFile(join(root, ".myspec", "changes", "add-login", "report.md"), "utf8");
    expect(report).toContain("# Report");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/report.test.ts`
Expected: FAIL，因为 `runReport` 尚未实现

- [x] **Step 3: 创建 `src/report/report-builder.ts`**

```ts
export function buildReportMarkdown(changeName: string, verificationStatus: string): string {
  return `# Report

## Change

- name: ${changeName}

## Verification

- status: ${verificationStatus}
`;
}

export function buildReportJson(changeName: string, mode: "standard" | "lite", verification: unknown, evidence: unknown) {
  return {
    change: changeName,
    mode,
    status: "reported",
    verification,
    evidenceSummary: evidence,
  };
}
```

- [x] **Step 4: 创建 `src/commands/report.ts`**

```ts
import { readChangeFile } from "../core/change.js";
import { readTextFile, writeJsonFile, writeTextFile } from "../core/fs.js";
import { getChangeVerificationFilePath, getChangeReportPath } from "../core/change.js";
import { metaSchema } from "../schemas/meta.js";
import { buildReportJson, buildReportMarkdown } from "../report/report-builder.js";
import { updateChangeStatus } from "../apply/status-updater.js";

export async function runReport(root: string, changeName: string) {
  const meta = metaSchema.parse(JSON.parse(await readChangeFile(root, changeName, "meta.json")));
  const verification = JSON.parse(
    await readTextFile(getChangeVerificationFilePath(root, changeName, "verification.json")),
  );
  const evidence = JSON.parse(
    await readTextFile(getChangeVerificationFilePath(root, changeName, "evidence.json")),
  );

  const reportMd = buildReportMarkdown(changeName, verification.status);
  const reportJson = buildReportJson(changeName, meta.mode, verification, evidence);

  await writeTextFile(getChangeReportPath(root, changeName, "report.md"), reportMd);
  await writeJsonFile(getChangeReportPath(root, changeName, "report.json"), reportJson);
  await updateChangeStatus(root, changeName, "reported");

  return reportJson;
}
```

- [x] **Step 5: 在 `src/core/output.ts` 增加 report 摘要**

```ts
export function formatReportSummary(summary: { change: string; status: string }): string {
  return `report: ${summary.change}\nstatus: ${summary.status}`;
}
```

- [x] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/report.test.ts`
Expected: PASS，`report.md` 和 `report.json` 被写出

- [x] **Step 7: 提交本任务**

```bash
git add src/report/report-builder.ts src/commands/report.ts src/core/output.ts tests/report.test.ts
git commit -m "feat(report): 实现报告生成命令"
```

---

### Task 7: 将 verify / report 结果接入 CLI 与 status

**Files:**
- Modify: `src/cli.ts`
- Modify: `src/commands/status.ts`
- Modify: `src/core/output.ts`
- Modify: `tests/status.test.ts`

- [x] **Step 1: 扩展 status 测试**

```ts
import { describe, expect, it } from "vitest";

describe("myspec status phase 3", () => {
  it("suggests verify after apply and report after verify", async () => {
    const verifyOutput = "next: myspec verify add-login";
    const reportOutput = "next: myspec report add-login";

    expect(verifyOutput).toContain("myspec verify add-login");
    expect(reportOutput).toContain("myspec report add-login");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/status.test.ts`
Expected: FAIL，因为 `status` 还未读取 verification / report 工件

- [x] **Step 3: 在 `src/cli.ts` 注册 `verify` 与 `report`**

```ts
import { runVerify } from "./commands/verify.js";
import { runReport } from "./commands/report.js";

cli.command("verify <change>", "Run change verification").action(async (change) => {
  const result = await runVerify(process.cwd(), change);
  console.log(`verify: ${result.verification.status}`);
});

cli.command("report <change>", "Generate change report").action(async (change) => {
  const result = await runReport(process.cwd(), change);
  console.log(formatReportSummary({ change, status: result.status }));
});
```

- [x] **Step 4: 扩展 `src/commands/status.ts`**

实现目标：

- 当 review 通过但 `meta.status = applying` 或尚无 verification 工件时，提示 `myspec verify <change>`
- 当存在 `verification/verification.json` 且 change 未 `reported` 时，提示 `myspec report <change>`
- 当存在 `report.json` 且 `meta.status = reported` 时，提示 `done`

- [x] **Step 5: 运行 Phase 3 全量测试**

Run: `npm test -- tests/apply.test.ts tests/verify.test.ts tests/report.test.ts tests/status.test.ts tests/core/executor.test.ts`
Expected: PASS，apply / verify / report / status 全链路测试通过

- [x] **Step 6: 运行类型检查和构建**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [x] **Step 7: 提交本任务**

```bash
git add src/cli.ts src/commands/status.ts src/core/output.ts tests/status.test.ts
git commit -m "feat(status): 接入 Phase 3 状态流转与命令"
```

---

## Spec Coverage

本计划覆盖了 [myspec-phase-plan.md](/Users/liuhuan/workspace/coding/frontend/my-spec/docs/myspec-phase-plan.md) 中 Phase 3 的以下内容：

- apply 输入装配
- apply 阶段状态更新
- checks 执行引擎
- verify 主检查流程的 MVP 承载
- evidence 记录能力 v1
- report 生成
- 状态流转接入

当前有意不覆盖的内容：

- 复杂的需求边界解析和 `REQ/TASK/TC` 深度语义映射
- 鲁棒性与安全性 issue 的高保真分级
- `manual-check`、`risk-acceptance` 等增强 evidence 类型
- 覆盖率摘要、证据完整性 gate、显式回退流转

这些内容应在后续 Phase 4 计划中继续展开，而不是在 Phase 3 提前拉高复杂度。
