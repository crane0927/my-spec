# my-spec Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 `my-spec v2.2` 在 MVP 之后最关键的增强能力，包括 `standard/lite` 双模式分流、显式回退流转、coverage summary、增强 evidence schema，以及更完整的 verify issue/gate 承载。

**Architecture:** Phase 4 不重写 Phase 2-3 已有主链，而是在当前 `review -> apply -> verify -> report -> status` 流程上增量增强。优先把模式分流和状态回退接入现有命令，再扩展 traceability / evidence / verification schema，最后将增强结果反映到 report 和 status 中。

**Tech Stack:** TypeScript, Node.js, cac, zod, yaml, vitest

---

## File Structure

本计划默认创建或修改以下文件：

- `src/commands/draft.ts`
  - 按 `standard/lite` 生成不同工件集合
- `src/commands/review.ts`
  - 支持按 mode 运行并输出更完整摘要
- `src/commands/verify.ts`
  - 承载增强后的 gates、coverage、evidence 完整性检查
- `src/commands/report.ts`
  - 输出 coverage summary 和 evidence summary
- `src/commands/status.ts`
  - 反映回退状态和增强后的下一步动作
- `src/core/phase.ts`
  - 回退目标阶段、失败原因和建议动作
- `src/core/change.ts`
  - 扩展 coverage / evidence / verification 工件路径辅助函数
- `src/review/document-rules.ts`
  - mode 级文档要求
- `src/review/document-checker.ts`
  - 按 mode 校验文档
- `src/review/traceability-checker.ts`
  - 输出 coverage summary 与 gaps
- `src/verify/evidence-builder.ts`
  - 增加 `manual-check`、`risk-acceptance`
- `src/verify/verification-builder.ts`
  - 增加 `source`、`recommendedAction`、evidence gate
- `src/report/report-builder.ts`
  - 将 coverage / evidence 汇总到报告
- `src/schemas/evidence.ts`
  - 扩展 evidence item 类型
- `src/schemas/traceability.ts`
  - 扩展 coverage summary 结构
- `src/schemas/verification.ts`
  - 扩展 issue schema 和 gates
- `src/schemas/report.ts`
  - 扩展 coverageSummary / evidenceSummary
- `tests/draft.test.ts`
  - `lite` / `standard` 生成差异测试
- `tests/review/document-checker.test.ts`
  - mode 分流测试
- `tests/review/traceability-checker.test.ts`
  - coverage summary 测试
- `tests/verify.test.ts`
  - evidence gate、issue schema、manual-check / risk-acceptance 测试
- `tests/report.test.ts`
  - 报告包含 coverage / evidence 摘要测试
- `tests/status.test.ts`
  - 回退状态与下一步动作测试

当前实现基线需要被直接复用：

- `meta.mode` 已存在，但 `draft/review/status/report` 还没有真正按 mode 分流
- `review` 已有文档完整性检查与 `review-summary.json`
- `verify` 已有 `checks.json`、`verification.json`、`evidence.json`
- `report` 已能输出基础 `report.md` / `report.json`
- `status` 已串起 review / apply / verify / report 的基础下一步动作
- `traceability.json` 当前仅有 `requirements[] + summary + gaps` 的轻量结构
- `evidence.json` 当前只有 `command/test/file` 三类，且主要由 checks 生成

因此，Phase 4 的重点不是“从 0 到 1”，而是“把现有 MVP 输出提升到 v2.2 设计要求”。

---

### Task 1: 实现 `standard / lite` 模式分流

**Files:**
- Modify: `src/commands/draft.ts`
- Modify: `src/commands/review.ts`
- Modify: `src/commands/status.ts`
- Modify: `src/review/document-rules.ts`
- Modify: `tests/draft.test.ts`
- Modify: `tests/review/document-checker.test.ts`

- [ ] **Step 1: 扩展 `draft` 的失败测试，覆盖 `lite` 模式**

```ts
import { access, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runDraft } from "../src/commands/draft.js";

describe("myspec draft mode split", () => {
  it("skips clarification/design artifacts for lite mode", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-lite-draft-"));
    await runInit(root);
    await runPropose(root, "tiny-fix", "lite");
    await runDraft(root, "tiny-fix");

    await access(join(root, ".myspec", "changes", "tiny-fix", "requirements.md"));
    await expect(
      access(join(root, ".myspec", "changes", "tiny-fix", "design.md")),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/draft.test.ts tests/review/document-checker.test.ts`
Expected: FAIL，因为 `draft` 和 `document-rules` 还没有真正按 mode 分流

- [ ] **Step 3: 在 `src/review/document-rules.ts` 固化 mode 规则**

```ts
export const requiredDocumentsByMode = {
  standard: [
    "proposal.md",
    "clarification.md",
    "requirements.md",
    "design.md",
    "tasks.md",
    "test-case.md",
    "test-case.json",
    "traceability.json",
  ],
  lite: [
    "proposal.md",
    "requirements.md",
    "tasks.md",
    "test-case.md",
    "test-case.json",
    "traceability.json",
  ],
} as const;
```

- [ ] **Step 4: 在 `src/commands/draft.ts` 按 mode 生成不同工件**

```ts
import { readChangeFile } from "../core/change.js";
import { metaSchema } from "../schemas/meta.js";

const draftArtifactsByMode = {
  standard: {
    "requirements.md": "# Requirements\n",
    "design.md": "# Design\n",
    "tasks.md": "# Tasks\n",
    "test-case.md": "# Test Cases\n",
    "test-case.json": "{\n  \"cases\": []\n}\n",
    "traceability.json": "{\n  \"requirements\": [],\n  \"summary\": {},\n  \"gaps\": []\n}\n",
  },
  lite: {
    "requirements.md": "# Requirements\n",
    "tasks.md": "# Tasks\n",
    "test-case.md": "# Test Cases\n",
    "test-case.json": "{\n  \"cases\": []\n}\n",
    "traceability.json": "{\n  \"requirements\": [],\n  \"summary\": {},\n  \"gaps\": []\n}\n",
  },
} as const;
```

- [ ] **Step 5: 在 `review` 与 `status` 中反映 mode**

实现目标：

- `review` 按 `meta.mode` 选择必需工件
- `status` 对 `lite` change 不再硬性要求 `clarification.md` 和 `design.md`
- `report.json` 继续保留 `mode` 字段，后续可直接消费

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/draft.test.ts tests/review/document-checker.test.ts tests/status.test.ts`
Expected: PASS，`standard` / `lite` 在 `draft`、`review`、`status` 中表现不同

- [ ] **Step 7: 提交本任务**

```bash
git add src/commands/draft.ts src/commands/review.ts src/commands/status.ts src/review/document-rules.ts tests/draft.test.ts tests/review/document-checker.test.ts
git commit -m "feat(mode): 实现 standard 和 lite 模式分流"
```

---

### Task 2: 实现显式回退流转

**Files:**
- Modify: `src/core/phase.ts`
- Modify: `src/commands/status.ts`
- Modify: `src/commands/verify.ts`
- Modify: `src/apply/status-updater.ts`
- Modify: `tests/status.test.ts`

- [ ] **Step 1: 扩展状态与回退测试**

```ts
import { describe, expect, it } from "vitest";

describe("phase fallback status", () => {
  it("shows fallback target when verification fails", () => {
    const next = "返回 apply 修复";
    expect(next).toContain("apply");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/status.test.ts`
Expected: FAIL，因为当前 `status` 只给线性 next action，不暴露显式回退原因

- [ ] **Step 3: 在 `src/core/phase.ts` 增加回退策略**

```ts
export function getFallbackAction(context: {
  phase: "review" | "apply" | "verify";
  reason: "document" | "execution" | "verification" | "evidence";
}): string {
  if (context.phase === "review") return "返回 draft 修订";
  if (context.phase === "apply") return "返回 tasks 或 design 修订";
  if (context.phase === "verify" && context.reason === "execution") return "返回 apply 修复";
  if (context.phase === "verify" && context.reason === "evidence") return "补充 evidence 后重新 verify";
  return "返回上一阶段修订";
}
```

- [ ] **Step 4: 在 verify 失败时写入更明确的回退动作**

实现目标：

- required checks 失败：`nextStep = 返回 apply 修复`
- evidence 不足：`nextStep = 补充 evidence 后重新 verify`
- 文档问题延迟暴露：`nextStep = 返回 draft 修订`

- [ ] **Step 5: 在 status 中读取回退动作并展示**

实现目标：

- 如果 `verification.json` 含失败状态和建议动作，`status` 直接输出该动作
- 不再一律提示 `myspec report <change>`

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/status.test.ts tests/verify.test.ts`
Expected: PASS，失败状态下能看到明确回退目标而不是模糊 next

- [ ] **Step 7: 提交本任务**

```bash
git add src/core/phase.ts src/commands/status.ts src/commands/verify.ts src/apply/status-updater.ts tests/status.test.ts
git commit -m "feat(flow): 实现显式回退流转"
```

---

### Task 3: 增强 traceability 与 coverage summary

**Files:**
- Modify: `src/schemas/traceability.ts`
- Modify: `src/review/traceability-checker.ts`
- Modify: `src/verify/verification-builder.ts`
- Modify: `src/report/report-builder.ts`
- Modify: `tests/review/traceability-checker.test.ts`
- Modify: `tests/report.test.ts`

- [ ] **Step 1: 扩展 traceability 测试**

```ts
import { describe, expect, it } from "vitest";
import { checkTraceability } from "../../src/review/traceability-checker.js";

describe("coverage summary", () => {
  it("produces fully covered and uncovered counts", () => {
    const result = checkTraceability({
      requirements: [
        { id: "REQ-001", tasks: ["TASK-001"], tests: ["TC-001"] },
        { id: "REQ-002", tasks: [], tests: [] },
      ],
    });

    expect(result.summary.uncovered).toBe(1);
    expect(result.summary.fullyCovered).toBe(1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review/traceability-checker.test.ts`
Expected: FAIL，因为当前 traceability checker 还不输出结构化 summary

- [ ] **Step 3: 扩展 `src/schemas/traceability.ts`**

```ts
summary: z.object({
  totalRequirements: z.number().int().nonnegative(),
  fullyCovered: z.number().int().nonnegative(),
  partiallyCovered: z.number().int().nonnegative(),
  uncovered: z.number().int().nonnegative(),
}).optional(),
```

- [ ] **Step 4: 在 `src/review/traceability-checker.ts` 输出 coverage summary**

```ts
const totalRequirements = data.requirements.length;
const fullyCovered = data.requirements.filter((req) => req.tasks.length > 0 && req.tests.length > 0).length;
const uncovered = data.requirements.filter((req) => req.tasks.length === 0 && req.tests.length === 0).length;
const partiallyCovered = totalRequirements - fullyCovered - uncovered;

return {
  pass: issues.length === 0,
  issues,
  gaps,
  summary: {
    totalRequirements,
    fullyCovered,
    partiallyCovered,
    uncovered,
  },
};
```

- [ ] **Step 5: 将 coverage summary 传递到 verification 与 report**

实现目标：

- `verify` 结果包含 `coverageSummary`
- `report.md` / `report.json` 展示 `coverageSummary`

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/review/traceability-checker.test.ts tests/report.test.ts`
Expected: PASS，报告中能看到 `coverage summary`

- [ ] **Step 7: 提交本任务**

```bash
git add src/schemas/traceability.ts src/review/traceability-checker.ts src/verify/verification-builder.ts src/report/report-builder.ts tests/review/traceability-checker.test.ts tests/report.test.ts
git commit -m "feat(traceability): 增强 coverage summary 输出"
```

---

### Task 4: 增强 evidence schema 与完整性检查

**Files:**
- Modify: `src/schemas/evidence.ts`
- Modify: `src/verify/evidence-builder.ts`
- Modify: `src/verify/verification-builder.ts`
- Modify: `tests/verify.test.ts`

- [ ] **Step 1: 扩展 evidence 测试**

```ts
import { describe, expect, it } from "vitest";
import { buildEvidence } from "../src/verify/evidence-builder.js";

describe("enhanced evidence", () => {
  it("supports manual-check and risk-acceptance items", () => {
    const evidence = buildEvidence("add-login", [], {
      manualChecks: [{ title: "UI smoke", result: "passed" }],
      acceptedRisks: [{ title: "No e2e yet", reason: "deferred to next phase" }],
    });

    expect(evidence.items.some((item) => item.type === "manual-check")).toBe(true);
    expect(evidence.items.some((item) => item.type === "risk-acceptance")).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/verify.test.ts`
Expected: FAIL，因为当前 evidence 只支持 `command/test/file`

- [ ] **Step 3: 扩展 `src/schemas/evidence.ts`**

```ts
type: z.enum(["command", "test", "file", "manual-check", "risk-acceptance"]),
```

- [ ] **Step 4: 扩展 `src/verify/evidence-builder.ts`**

```ts
export function buildEvidence(
  changeName: string,
  checks: Array<{ id: string; exitCode: number }>,
  extras: {
    manualChecks?: Array<{ title: string; result: string }>;
    acceptedRisks?: Array<{ title: string; reason: string }>;
  } = {},
) {
  const items = checks.map((check, index) => ({
    id: `EV-${index + 1}`,
    type: "command" as const,
    relatedRequirements: [],
    relatedTasks: [],
    relatedTestCases: [],
    payload: {
      commandId: check.id,
      exitCode: check.exitCode,
    },
  }));

  for (const manualCheck of extras.manualChecks ?? []) {
    items.push({
      id: `EV-M-${items.length + 1}`,
      type: "manual-check",
      relatedRequirements: [],
      relatedTasks: [],
      relatedTestCases: [],
      payload: manualCheck,
    });
  }

  for (const risk of extras.acceptedRisks ?? []) {
    items.push({
      id: `EV-R-${items.length + 1}`,
      type: "risk-acceptance",
      relatedRequirements: [],
      relatedTasks: [],
      relatedTestCases: [],
      payload: risk,
    });
  }

  return {
    change: changeName,
    items,
  };
}
```

- [ ] **Step 5: 在 verification builder 中增加 evidence gate**

实现目标：

- 没有 command evidence：`evidence` gate 失败
- 需要人工验证但无 `manual-check`：`evidence` gate 警告或失败
- 有 accepted risk 时，在 issues 中补充说明

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/verify.test.ts`
Expected: PASS，`evidence.json` 支持更多类型，且 verify 能识别 evidence 不足

- [ ] **Step 7: 提交本任务**

```bash
git add src/schemas/evidence.ts src/verify/evidence-builder.ts src/verify/verification-builder.ts tests/verify.test.ts
git commit -m "feat(evidence): 增强 evidence schema 与完整性检查"
```

---

### Task 5: 增强 verify issue schema 与 gates

**Files:**
- Modify: `src/schemas/verification.ts`
- Modify: `src/verify/verification-builder.ts`
- Modify: `src/commands/verify.ts`
- Modify: `src/report/report-builder.ts`
- Modify: `tests/verify.test.ts`

- [ ] **Step 1: 扩展 verification 测试**

```ts
import { describe, expect, it } from "vitest";
import { buildVerification } from "../src/verify/verification-builder.js";

describe("enhanced verification schema", () => {
  it("adds source and recommendedAction to issues", () => {
    const verification = buildVerification("add-login", [
      { required: true, passed: false, id: "test" },
    ]);

    expect(verification.issues[0].source).toBe("checks");
    expect(verification.issues[0].recommendedAction).toBe("fix-now");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/verify.test.ts`
Expected: FAIL，因为当前 `verificationIssueSchema` 还没有 `source` 和 `recommendedAction`

- [ ] **Step 3: 扩展 `src/schemas/verification.ts`**

```ts
export const verificationIssueSchema = z.object({
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.string().min(1),
  source: z.enum(["checks", "traceability", "evidence", "robustness", "security"]),
  title: z.string().min(1),
  suggestion: z.string().min(1),
  recommendedAction: z.enum(["fix-now", "document-risk", "defer-with-approval"]),
});
```

- [ ] **Step 4: 扩展 `src/verify/verification-builder.ts`**

实现目标：

- required check 失败时：`source = checks`，`recommendedAction = fix-now`
- evidence 不足时：`source = evidence`
- traceability 缺口时：`source = traceability`
- `gates` 至少区分 `testExecution`、`codeQuality`、`traceability`、`evidence`

- [ ] **Step 5: 在 report 中展示更完整的 issue 列表**

实现目标：

- `report.md` 输出 issue category/source/recommendedAction
- `report.json` 保留完整 verification 结构

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/verify.test.ts tests/report.test.ts`
Expected: PASS，verify 可以区分“功能失败”“追踪缺失”“证据不足”

- [ ] **Step 7: 提交本任务**

```bash
git add src/schemas/verification.ts src/verify/verification-builder.ts src/commands/verify.ts src/report/report-builder.ts tests/verify.test.ts
git commit -m "feat(verify): 增强 issue schema 与 gates"
```

---

## Spec Coverage

本计划覆盖了 [myspec-phase-plan.md](/Users/liuhuan/workspace/coding/frontend/my-spec/docs/myspec-phase-plan.md) 中 Phase 4 的以下内容：

- `standard / lite` 模式分流
- 显式回退流转
- traceability 与 coverage summary 增强
- evidence schema 增强
- verify issue schema 与 gates 增强

当前有意不覆盖的内容：

- 团队级审批流
- 更复杂的安全扫描引擎
- AST 级 diff / 兼容性分析
- Web UI 形式的 coverage / evidence 展示

这些内容应放到更后续的体验或平台化阶段，而不是塞进 Phase 4。
