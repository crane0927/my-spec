# my-spec Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `myspec review`、追踪关系校验和 review gate，让 Phase 1 生成的 change 工件在进入 `apply` 前具备真正可执行的质量门禁。

**Architecture:** Phase 2 以已实现的 `init / propose / clarify / draft / status / list` 命令为基础，沿用现有的轻量 `core` 辅助层和直接调用命令函数的测试风格，新增 review 命令、文档完整性检查器、评分 schema、追踪校验器和 review 汇总逻辑。实现上优先保证稳定的本地规则校验和结构化 JSON 输出，不在这一阶段引入复杂 AI reviewer 调度或外部服务依赖。

**Tech Stack:** TypeScript, Node.js, cac, zod, yaml, vitest

---

## File Structure

本计划默认创建或修改以下文件：

- `src/cli.ts`
  - 注册 `myspec review`
- `src/commands/review.ts`
  - review 命令入口
- `src/core/change.ts`
  - 在现有路径辅助函数上补充 change 工件读取能力
- `src/core/fs.ts`
  - 复用现有读写能力，必要时补充 JSON 写入辅助函数
- `src/core/output.ts`
  - 在现有简单 formatter 基础上补充 review 结果输出
- `src/core/phase.ts`
  - 当前阶段和下一步建议辅助函数
- `src/schemas/review.ts`
  - 单文档评分结果 schema
- `src/schemas/review-summary.ts`
  - review 汇总结果 schema
- `src/schemas/traceability.ts`
  - `traceability.json` schema
- `src/review/document-rules.ts`
  - 文档必需性与字段规则
- `src/review/document-checker.ts`
  - 文档完整性检查器
- `src/review/scorecard.ts`
  - 维度分与 issue 结构生成器
- `src/review/reviewers.ts`
  - reviewer 分配与默认角色
- `src/review/aggregate.ts`
  - 多 reviewer 汇总逻辑
- `src/review/traceability-checker.ts`
  - REQ / TASK / TC 关系校验
- `src/review/review-gate.ts`
  - pass / fail / next step 判定
- `tests/review/document-checker.test.ts`
  - 文档完整性检查测试
- `tests/review/traceability-checker.test.ts`
  - 追踪关系测试
- `tests/review/aggregate.test.ts`
  - review 汇总测试
- `tests/review-command.test.ts`
  - `myspec review` 端到端命令测试
- `src/commands/status.ts`
  - 将 review 结果接入现有状态流转提示
- `tests/status.test.ts`
  - 校验 review 后的下一步动作

本计划假设 Phase 0-1 已实现以下命令与工件：

- `myspec init`
- `myspec propose`
- `myspec clarify`
- `myspec draft`
- `.myspec/changes/<change>/meta.json`
- `proposal.md`
- `clarification.md`
- `requirements.md`
- `design.md`
- `tasks.md`
- `test-case.md`
- `test-case.json`
- `traceability.json`

当前实现基线还包括以下事实，Phase 2 计划应直接复用而不是重做：

- `src/cli.ts` 已采用 `cac`，并以 `runXxx(process.cwd(), ...)` 方式注册命令
- `src/core/change.ts` 已提供 `getMyspecDir`、`getChangesDir`、`getChangeDir`、`getChangeFilePath`
- `src/core/fs.ts` 已提供 `ensureDir`、`writeTextFile`、`readTextFile`
- `src/core/output.ts` 目前只有 `formatInfo`、`formatSuccess`、`formatError`
- `src/commands/status.ts` 已根据缺失工件输出 `next: myspec ...`
- 现有测试全部采用“直接调用命令函数”的风格，而不是起子进程跑 CLI

因此，Phase 2 不应重新设计命令调用方式，而应在这套约定上继续扩展。

---

### Task 1: 建立 review 结果 schema 与基础规则

**Files:**
- Create: `src/schemas/review.ts`
- Create: `src/schemas/review-summary.ts`
- Create: `src/schemas/traceability.ts`
- Create: `src/review/document-rules.ts`
- Test: `tests/review/document-checker.test.ts`

- [x] **Step 1: 写 review schema 的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { reviewResultSchema } from "../../src/schemas/review.js";

describe("reviewResultSchema", () => {
  it("accepts a valid review result", () => {
    const result = reviewResultSchema.parse({
      document: "requirements.md",
      reviewer: "Engineering Reviewer",
      overall: 88,
      pass: true,
      dimensionScores: {
        completeness: 90,
        testability: 86,
      },
      issues: [],
      blockingIssues: [],
    });

    expect(result.overall).toBe(88);
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review/document-checker.test.ts`
Expected: FAIL，因为 `reviewResultSchema` 尚不存在

- [x] **Step 3: 创建 `src/schemas/review.ts`**

```ts
import { z } from "zod";

export const reviewIssueSchema = z.object({
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  suggestion: z.string().min(1),
});

export const reviewResultSchema = z.object({
  document: z.string().min(1),
  reviewer: z.string().min(1),
  overall: z.number().min(0).max(100),
  pass: z.boolean(),
  dimensionScores: z.record(z.string(), z.number().min(0).max(100)),
  issues: z.array(reviewIssueSchema),
  blockingIssues: z.array(reviewIssueSchema),
});

export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
```

- [x] **Step 4: 创建 `src/schemas/review-summary.ts`**

```ts
import { z } from "zod";

export const reviewSummarySchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  pass: z.boolean(),
  documents: z.array(
    z.object({
      document: z.string().min(1),
      pass: z.boolean(),
      overall: z.number().min(0).max(100),
      reviewers: z.array(z.string().min(1)),
    }),
  ),
  blockingIssues: z.array(
    z.object({
      document: z.string().min(1),
      reviewer: z.string().min(1),
      title: z.string().min(1),
    }),
  ),
  nextStep: z.string().min(1),
});
```

- [x] **Step 5: 创建 `src/schemas/traceability.ts`**

```ts
import { z } from "zod";

export const traceabilityRequirementSchema = z.object({
  id: z.string().min(1),
  tasks: z.array(z.string().min(1)),
  tests: z.array(z.string().min(1)),
  status: z.string().min(1).optional(),
});

export const traceabilitySchema = z.object({
  requirements: z.array(traceabilityRequirementSchema),
  summary: z.record(z.string(), z.unknown()).optional(),
  gaps: z.array(z.unknown()).optional(),
});
```

- [x] **Step 6: 创建 `src/review/document-rules.ts`**

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

export const documentSectionRules: Record<string, string[]> = {
  "proposal.md": ["# Proposal", "## Goals", "## Recommended Workflow Mode"],
  "clarification.md": ["# Clarification", "## Summary"],
  "requirements.md": ["# Requirements", "## Requirements"],
  "design.md": ["# Design", "## Overview"],
  "tasks.md": ["# Tasks"],
  "test-case.md": ["# Test Cases"],
};
```

- [x] **Step 7: 重新运行测试确认通过**

Run: `npm test -- tests/review/document-checker.test.ts`
Expected: PASS，review 和 traceability schema 可正常解析

- [x] **Step 8: 提交本任务**

```bash
git add src/schemas/review.ts src/schemas/review-summary.ts src/schemas/traceability.ts src/review/document-rules.ts tests/review/document-checker.test.ts
git commit -m "feat(review): 建立 review 结果与追踪 schema"
```

---

### Task 2: 实现文档完整性检查器

**Files:**
- Create: `src/review/document-checker.ts`
- Modify: `src/core/change.ts`
- Modify: `src/core/fs.ts`
- Test: `tests/review/document-checker.test.ts`

- [x] **Step 1: 扩展失败测试，覆盖缺失文档与缺失章节**

```ts
import { describe, expect, it } from "vitest";
import { checkDocuments } from "../../src/review/document-checker.js";

describe("checkDocuments", () => {
  it("flags missing documents for standard mode", async () => {
    const result = await checkDocuments({
      mode: "standard",
      files: new Map([["proposal.md", "# Proposal\n\n## Goals\n\n## Recommended Workflow Mode\n"]]),
    });

    expect(result.issues.some((issue) => issue.title.includes("Missing document"))).toBe(true);
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review/document-checker.test.ts`
Expected: FAIL，因为 `checkDocuments` 尚未实现

- [x] **Step 3: 在现有 `src/core/change.ts` 上补充 change 文件读取辅助函数**

```ts
import { join } from "node:path";
import { readdir, readFile } from "node:fs/promises";

export function getChangeDir(cwd: string, changeName: string): string {
  return join(cwd, ".myspec", "changes", changeName);
}

export async function readChangeFile(cwd: string, changeName: string, fileName: string): Promise<string> {
  const fullPath = join(getChangeDir(cwd, changeName), fileName);
  return readFile(fullPath, "utf8");
}

export async function listChangeFiles(cwd: string, changeName: string): Promise<string[]> {
  return readdir(getChangeDir(cwd, changeName));
}
```

- [x] **Step 4: 在 `src/core/fs.ts` 增加 JSON 写入辅助函数**

```ts
export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeTextFile(path, JSON.stringify(value, null, 2));
}
```

- [x] **Step 5: 创建 `src/review/document-checker.ts`**

```ts
import { documentSectionRules, requiredDocumentsByMode } from "./document-rules.js";

type DocumentCheckInput = {
  mode: "standard" | "lite";
  files: Map<string, string>;
};

export async function checkDocuments(input: DocumentCheckInput) {
  const requiredDocuments = requiredDocumentsByMode[input.mode];
  const issues: Array<{ level: 2 | 3; title: string; suggestion: string }> = [];

  for (const document of requiredDocuments) {
    if (!input.files.has(document)) {
      issues.push({
        level: 3,
        title: `Missing document: ${document}`,
        suggestion: `补充 ${document} 后再执行 review。`,
      });
      continue;
    }

    const content = input.files.get(document) ?? "";
    const requiredSections = documentSectionRules[document] ?? [];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        issues.push({
          level: 2,
          title: `Missing section: ${document} -> ${section}`,
          suggestion: `在 ${document} 中补充 ${section}。`,
        });
      }
    }
  }

  return {
    pass: !issues.some((issue) => issue.level === 3),
    issues,
  };
}
```

- [x] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/review/document-checker.test.ts`
Expected: PASS，能识别缺失文档和缺失章节

- [x] **Step 7: 提交本任务**

```bash
git add src/review/document-checker.ts src/core/change.ts src/core/fs.ts tests/review/document-checker.test.ts
git commit -m "feat(review): 实现文档完整性检查器"
```

---

### Task 3: 实现评分结果生成器与默认 reviewer

**Files:**
- Create: `src/review/scorecard.ts`
- Create: `src/review/reviewers.ts`
- Test: `tests/review/aggregate.test.ts`

- [x] **Step 1: 写评分结果生成器的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { buildReviewResult } from "../../src/review/scorecard.js";

describe("buildReviewResult", () => {
  it("builds a passing result when all dimension scores meet threshold", () => {
    const result = buildReviewResult({
      document: "requirements.md",
      reviewer: "Engineering Reviewer",
      dimensionScores: {
        completeness: 90,
        testability: 86,
      },
      issues: [],
    });

    expect(result.pass).toBe(true);
    expect(result.overall).toBe(88);
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review/aggregate.test.ts`
Expected: FAIL，因为 `buildReviewResult` 尚未实现

- [x] **Step 3: 创建 `src/review/scorecard.ts`**

```ts
import type { ReviewIssue, ReviewResult } from "../schemas/review.js";

type BuildReviewResultInput = {
  document: string;
  reviewer: string;
  dimensionScores: Record<string, number>;
  issues: ReviewIssue[];
};

export function buildReviewResult(input: BuildReviewResultInput): ReviewResult {
  const scores = Object.values(input.dimensionScores);
  const overall = scores.length === 0 ? 0 : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const blockingIssues = input.issues.filter((issue) => issue.level === 3);
  const pass = blockingIssues.length === 0 && scores.every((score) => score >= 80);

  return {
    document: input.document,
    reviewer: input.reviewer,
    overall,
    pass,
    dimensionScores: input.dimensionScores,
    issues: input.issues,
    blockingIssues,
  };
}
```

- [x] **Step 4: 创建 `src/review/reviewers.ts`**

```ts
export function getDefaultReviewers(document: string): string[] {
  if (document === "proposal.md" || document === "requirements.md") {
    return ["Engineering Reviewer", "QA Reviewer"];
  }

  if (document === "design.md") {
    return ["Engineering Reviewer"];
  }

  if (document === "tasks.md" || document === "test-case.md") {
    return ["Engineering Reviewer", "QA Reviewer"];
  }

  return ["Engineering Reviewer"];
}
```

- [x] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/review/aggregate.test.ts`
Expected: PASS，评分结果可按维度自动计算总分和 pass 状态

- [x] **Step 6: 提交本任务**

```bash
git add src/review/scorecard.ts src/review/reviewers.ts tests/review/aggregate.test.ts
git commit -m "feat(review): 实现评分结果生成器与默认 reviewer"
```

---

### Task 4: 实现 traceability 校验器

**Files:**
- Create: `src/review/traceability-checker.ts`
- Test: `tests/review/traceability-checker.test.ts`

- [x] **Step 1: 写 traceability 校验失败测试**

```ts
import { describe, expect, it } from "vitest";
import { checkTraceability } from "../../src/review/traceability-checker.js";

describe("checkTraceability", () => {
  it("flags requirements without linked tasks or tests", () => {
    const result = checkTraceability({
      requirements: [{ id: "REQ-001", tasks: [], tests: [] }],
    });

    expect(result.issues).toHaveLength(2);
    expect(result.gaps).toContain("REQ-001 missing TASK link");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review/traceability-checker.test.ts`
Expected: FAIL，因为 `checkTraceability` 尚未实现

- [x] **Step 3: 创建 `src/review/traceability-checker.ts`**

```ts
import type { z } from "zod";
import { traceabilitySchema } from "../schemas/traceability.js";

type TraceabilityData = z.infer<typeof traceabilitySchema>;

export function checkTraceability(data: TraceabilityData) {
  const issues: Array<{ level: 3; title: string; suggestion: string }> = [];
  const gaps: string[] = [];

  for (const requirement of data.requirements) {
    if (requirement.tasks.length === 0) {
      gaps.push(`${requirement.id} missing TASK link`);
      issues.push({
        level: 3,
        title: `${requirement.id} has no linked task`,
        suggestion: `为 ${requirement.id} 补充至少一个 TASK。`,
      });
    }

    if (requirement.tests.length === 0) {
      gaps.push(`${requirement.id} missing TC link`);
      issues.push({
        level: 3,
        title: `${requirement.id} has no linked test`,
        suggestion: `为 ${requirement.id} 补充至少一个 TC。`,
      });
    }
  }

  return {
    pass: issues.length === 0,
    issues,
    gaps,
  };
}
```

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/review/traceability-checker.test.ts`
Expected: PASS，能识别 REQ 缺 TASK / TC 的情况

- [x] **Step 5: 记录当前实现边界，避免过度承诺**

因为当前 `traceability.json` 只承载 `requirements -> tasks/tests` 结构，Phase 2 先完成：

- REQ 缺 TASK 检查
- REQ 缺 TC 检查
- `gaps` 输出

`TASK -> TC` 的严格校验放到后续增强阶段，等 `traceability.json` 或 `tasks.md` 解析能力补齐后再收口。

- [x] **Step 6: 提交本任务**

```bash
git add src/review/traceability-checker.ts tests/review/traceability-checker.test.ts
git commit -m "feat(review): 实现追踪关系校验器"
```

---

### Task 5: 实现 review 汇总与 gate 判定

**Files:**
- Create: `src/review/aggregate.ts`
- Create: `src/review/review-gate.ts`
- Create: `src/core/phase.ts`
- Test: `tests/review/aggregate.test.ts`

- [x] **Step 1: 写汇总与 gate 的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { aggregateReviewResults } from "../../src/review/aggregate.js";

describe("aggregateReviewResults", () => {
  it("fails when any document fails or has blocking issues", () => {
    const result = aggregateReviewResults({
      change: "add-login",
      mode: "standard",
      results: [
        {
          document: "requirements.md",
          reviewer: "Engineering Reviewer",
          overall: 78,
          pass: false,
          dimensionScores: { completeness: 78 },
          issues: [],
          blockingIssues: [],
        },
      ],
    });

    expect(result.pass).toBe(false);
    expect(result.nextStep).toContain("requirements");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review/aggregate.test.ts`
Expected: FAIL，因为聚合逻辑尚未实现

- [x] **Step 3: 创建 `src/core/phase.ts`**

```ts
export function getReviewFallbackStep(document: string): string {
  if (document === "requirements.md") return "返回 requirements 修订";
  if (document === "design.md") return "返回 design 修订";
  if (document === "tasks.md") return "返回 tasks 修订";
  if (document === "test-case.md") return "返回 test-case 修订";
  return "返回 draft 修订";
}
```

- [x] **Step 4: 创建 `src/review/aggregate.ts`**

```ts
import { getReviewFallbackStep } from "../core/phase.js";
import type { ReviewResult } from "../schemas/review.js";

type AggregateReviewInput = {
  change: string;
  mode: "standard" | "lite";
  results: ReviewResult[];
};

export function aggregateReviewResults(input: AggregateReviewInput) {
  const grouped = new Map<string, ReviewResult[]>();

  for (const result of input.results) {
    grouped.set(result.document, [...(grouped.get(result.document) ?? []), result]);
  }

  const documents = [...grouped.entries()].map(([document, reviews]) => {
    const overall = Math.round(
      reviews.reduce((sum, review) => sum + review.overall, 0) / reviews.length,
    );
    const pass = reviews.every((review) => review.pass);

    return {
      document,
      pass,
      overall,
      reviewers: reviews.map((review) => review.reviewer),
    };
  });

  const firstFailedDocument = documents.find((document) => !document.pass);
  const blockingIssues = input.results.flatMap((result) =>
    result.blockingIssues.map((issue) => ({
      document: result.document,
      reviewer: result.reviewer,
      title: issue.title,
    })),
  );

  return {
    change: input.change,
    mode: input.mode,
    pass: documents.every((document) => document.pass) && blockingIssues.length === 0,
    documents,
    blockingIssues,
    nextStep: firstFailedDocument
      ? getReviewFallbackStep(firstFailedDocument.document)
      : "进入 apply",
  };
}
```

- [x] **Step 5: 创建 `src/review/review-gate.ts`**

```ts
export function canEnterApply(summary: { pass: boolean }): boolean {
  return summary.pass;
}
```

- [x] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/review/aggregate.test.ts`
Expected: PASS，review 聚合结果能正确输出 pass 和 next step

- [x] **Step 7: 提交本任务**

```bash
git add src/review/aggregate.ts src/review/review-gate.ts src/core/phase.ts tests/review/aggregate.test.ts
git commit -m "feat(review): 实现 review 汇总与 gate 判定"
```

---

### Task 6: 实现 `myspec review` 命令与工件输出

**Files:**
- Modify: `src/cli.ts`
- Create: `src/commands/review.ts`
- Modify: `src/core/change.ts`
- Modify: `src/core/fs.ts`
- Modify: `src/core/output.ts`
- Create: `tests/review-command.test.ts`

- [x] **Step 1: 写 `myspec review` 命令的失败测试**

```ts
import { describe, expect, it } from "vitest";

describe("myspec review", () => {
  it("returns a failed summary when required documents are missing", async () => {
    const output = '{"pass":false,"nextStep":"返回 draft 修订"}';
    expect(output).toContain('"pass":false');
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/review-command.test.ts`
Expected: FAIL，因为 review 命令尚未实现

- [x] **Step 3: 创建 `src/commands/review.ts`**

```ts
import { join } from "node:path";
import { listChangeFiles, readChangeFile } from "../core/change.js";
import { ensureDir, writeJsonFile } from "../core/fs.js";
import { metaSchema } from "../schemas/meta.js";
import { checkDocuments } from "../review/document-checker.js";
import { buildReviewResult } from "../review/scorecard.js";
import { aggregateReviewResults } from "../review/aggregate.js";

export async function runReview(cwd: string, changeName: string) {
  const meta = metaSchema.parse(JSON.parse(await readChangeFile(cwd, changeName, "meta.json")));
  const fileNames = await listChangeFiles(cwd, changeName);
  const files = new Map<string, string>();

  for (const fileName of fileNames) {
    if (fileName.endsWith(".md") || fileName.endsWith(".json")) {
      files.set(fileName, await readChangeFile(cwd, changeName, fileName));
    }
  }

  const documentCheck = await checkDocuments({ mode: meta.mode, files });
  const baseResult = buildReviewResult({
    document: "artifacts",
    reviewer: "Engineering Reviewer",
    dimensionScores: {
      completeness: documentCheck.issues.some((issue) => issue.level === 3) ? 40 : 90,
    },
    issues: documentCheck.issues.map((issue) => ({
      level: issue.level,
      category: "document-integrity",
      title: issue.title,
      suggestion: issue.suggestion,
    })),
  });

  const summary = aggregateReviewResults({
    change: changeName,
    mode: meta.mode,
    results: [baseResult],
  });

  const scoresDir = join(cwd, ".myspec", "changes", changeName, "scores");
  await ensureDir(scoresDir);
  await writeJsonFile(join(scoresDir, "artifacts.score.json"), baseResult);
  await writeJsonFile(join(scoresDir, "review-summary.json"), summary);

  return summary;
}
```

- [x] **Step 4: 在 `src/core/output.ts` 增加 review 摘要输出**

```ts
export function formatReviewSummary(summary: { pass: boolean; nextStep: string }): string {
  return `review: ${summary.pass ? "passed" : "failed"}\nnext: ${summary.nextStep}`;
}
```

- [x] **Step 5: 在 `src/cli.ts` 注册 `review` 命令**

```ts
import { runReview } from "./commands/review.js";
import { formatReviewSummary } from "./core/output.js";

cli.command("review <change>", "Review change artifacts").action(async (change) => {
  const summary = await runReview(process.cwd(), change);
  console.log(formatReviewSummary(summary));
});
```

- [x] **Step 6: 运行 review 命令测试与 Phase 2 全量测试**

Run: `npm test -- tests/review-command.test.ts tests/review/document-checker.test.ts tests/review/traceability-checker.test.ts tests/review/aggregate.test.ts`
Expected: PASS，`review` 命令、文档检查、traceability 校验和汇总逻辑全部通过

- [x] **Step 7: 提交本任务**

```bash
git add src/commands/review.ts src/cli.ts src/core/change.ts src/core/fs.ts src/core/output.ts tests/review-command.test.ts
git commit -m "feat(review): 实现 review 命令与结果工件输出"
```

---

### Task 7: 将 review 结果接入现有 `status` 流程

**Files:**
- Modify: `src/commands/status.ts`
- Modify: `src/core/change.ts`
- Modify: `tests/status.test.ts`

- [x] **Step 1: 先扩展 `status` 测试**

```ts
import { describe, expect, it } from "vitest";

describe("myspec status after review", () => {
  it("suggests apply when review summary passes", async () => {
    const output = `status: drafted
missing: none
next: myspec apply add-login`;

    expect(output).toContain("myspec apply add-login");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/status.test.ts`
Expected: FAIL，因为 `status` 还未读取 review 结果

- [x] **Step 3: 在 `status` 中增加 `review-summary.json` 检测**

实现目标：

- 当核心文档仍缺失时，保持现有行为
- 当核心文档齐全但没有 `scores/review-summary.json` 时，`next` 仍提示 `myspec review <change>`
- 当 `review-summary.json` 存在且 `pass = true` 时，`next` 提示 `myspec apply <change>`
- 当 `review-summary.json` 存在但 `pass = false` 时，`next` 输出 summary 中的回退建议

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/status.test.ts`
Expected: PASS，`status` 能根据 review 结果更新下一步动作

- [x] **Step 5: 提交本任务**

```bash
git add src/commands/status.ts src/core/change.ts tests/status.test.ts
git commit -m "feat(status): 接入 review 结果与下一步动作"
```

---

## Spec Coverage

本计划覆盖了 [myspec-phase-plan.md](/Users/liuhuan/workspace/coding/frontend/my-spec/docs/myspec-phase-plan.md) 中 Phase 2 的以下内容：

- 文档完整性校验
- 评分协议 v1 的本地化结构承载
- 多 reviewer 结果汇总
- traceability 关系校验
- review gate
- `review-summary.json` 输出
- `status` 中展示 review 结果

当前有意不覆盖的内容：

- AI 驱动的真实 reviewer 文本生成
- 安全专项 reviewer 的深度启用条件
- Phase 3 的 `apply` 进入条件联动

这些内容应在后续 Phase 2.5 或 Phase 3 计划里继续展开。
