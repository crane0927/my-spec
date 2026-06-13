# my-spec Phase 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 `my-spec` 的交付收尾工作，使新用户可以按文档完成端到端演练，理解跨技术栈配置方式，并具备基础发布与对外试用条件。

**Architecture:** Phase 5 不再扩展核心流程，而是围绕已实现的 `init / propose / draft / review / apply / verify / report / status` 主链做体验和交付层补强。优先统一终端输出与错误表达，然后补齐 README、示例 change、跨语言配置文档，最后完善 package 元数据和发布脚本。

**Tech Stack:** TypeScript, Node.js, cac, vitest, npm packaging

---

## File Structure

本计划默认创建或修改以下文件：

- `README.md`
  - 项目介绍、安装、快速开始、命令说明
- `docs/examples/standard-change/`
  - 标准模式示例 change
- `docs/examples/lite-change/`
  - 轻量模式示例 change
- `docs/config/python.md`
  - Python 项目 checks 配置说明
- `docs/config/go.md`
  - Go 项目 checks 配置说明
- `docs/config/rust.md`
  - Rust 项目 checks 配置说明
- `docs/faq.md`
  - 常见问题与排障说明
- `src/core/output.ts`
  - 统一终端输出风格
- `src/core/errors.ts`
  - 常见错误分类与友好错误文案
- `src/cli.ts`
  - 统一错误兜底和用户可读输出
- `src/templates/defaults.ts`
  - 默认模板与配置注释补强
- `package.json`
  - 发布元信息、额外脚本
- `.npmignore`
  - 发布过滤
- `CHANGELOG.md`
  - 初始变更日志
- `tests/status.test.ts`
  - 终端输出与状态文案回归测试
- `tests/cli-output.test.ts`
  - 输出格式测试

当前实现基线需要被直接复用：

- CLI 主链命令已经存在并可运行
- `status` 已能给出下一步动作
- `output.ts` 仍较为简陋，只支持 `info/success/error` 与少量摘要输出
- 仓库里还没有 `README.md`、FAQ、示例目录、跨语言配置文档
- `package.json` 目前还缺少对外发布所需的 metadata 和 release 脚本

因此，Phase 5 的重点是“降低理解和使用门槛”，而不是继续增加工作流复杂度。

---

### Task 1: 统一终端输出与错误表达

**Files:**
- Modify: `src/core/output.ts`
- Modify: `src/core/errors.ts`
- Modify: `src/cli.ts`
- Create: `tests/cli-output.test.ts`

- [ ] **Step 1: 写输出格式失败测试**

```ts
import { describe, expect, it } from "vitest";
import { formatInfo, formatSuccess, formatError } from "../src/core/output.js";

describe("cli output", () => {
  it("formats labeled output consistently", () => {
    expect(formatInfo("loading")).toBe("info: loading");
    expect(formatSuccess("done")).toBe("success: done");
    expect(formatError("failed")).toBe("error: failed");
  });
});
```

- [ ] **Step 2: 写更丰富的输出预期测试**

```ts
import { describe, expect, it } from "vitest";
import { formatNextAction, formatWarning } from "../src/core/output.js";

describe("enhanced cli output", () => {
  it("formats warning and next action messages", () => {
    expect(formatWarning("missing config")).toBe("warning: missing config");
    expect(formatNextAction("myspec review add-login")).toContain("next:");
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -- tests/cli-output.test.ts`
Expected: FAIL，因为 `formatWarning` 和 `formatNextAction` 尚不存在

- [ ] **Step 4: 扩展 `src/core/output.ts`**

```ts
export function formatWarning(message: string): string {
  return `warning: ${message}`;
}

export function formatNextAction(action: string): string {
  return `next: ${action}`;
}

export function formatBlock(message: {
  title: string;
  lines: string[];
}): string {
  return [message.title, ...message.lines].join("\n");
}
```

- [ ] **Step 5: 在 `src/core/errors.ts` 增加面向用户的错误格式化**

```ts
export class MyspecError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MyspecError";
  }
}

export function formatUserError(error: unknown): string {
  if (error instanceof MyspecError) {
    return `error: [${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return `error: ${error.message}`;
  }

  return "error: unknown failure";
}
```

- [ ] **Step 6: 在 `src/cli.ts` 增加统一错误兜底**

实现目标：

- 所有命令 action 包在统一的 `try/catch` 中
- 捕获错误时输出用户可读错误文案
- 退出码统一为非 0

- [ ] **Step 7: 运行测试确认通过**

Run: `npm test -- tests/cli-output.test.ts tests/status.test.ts`
Expected: PASS，warning / next action / error 格式稳定输出

- [ ] **Step 8: 提交本任务**

```bash
git add src/core/output.ts src/core/errors.ts src/cli.ts tests/cli-output.test.ts
git commit -m "feat(cli): 统一终端输出与错误表达"
```

---

### Task 2: 补齐 README 与快速开始文档

**Files:**
- Create: `README.md`
- Modify: `src/templates/defaults.ts`
- Test: `tests/status.test.ts`

- [ ] **Step 1: 新建 `README.md` 基础结构**

```md
# myspec

面向个人开发流程的 SDD CLI + AI Coding Assistant 工作流框架。

## Quick Start

1. 安装依赖
2. 构建 CLI
3. 初始化项目
4. 创建 change
5. 生成文档并执行 review / apply / verify / report

## Commands

- `myspec init`
- `myspec propose <change>`
- `myspec clarify <change>`
- `myspec draft <change>`
- `myspec review <change>`
- `myspec apply <change>`
- `myspec verify <change>`
- `myspec report <change>`
- `myspec status <change>`
- `myspec list`
```

- [ ] **Step 2: 在 README 中补齐最小演练流程**

内容应包括：

- 初始化命令
- 标准模式示例
- `status` 的使用方式
- 从 `propose` 到 `report` 的最短路径

- [ ] **Step 3: 在 README 中补齐关键概念**

内容应包括：

- `standard` 与 `lite` 区别
- `change` 是什么
- `review` / `verify` 的区别

- [ ] **Step 4: 在 `src/templates/defaults.ts` 中补充默认配置注释**

实现目标：

- 让 `config.yaml` 初始内容更可读
- 对 `checks.commands` 给出注释或更清楚的默认示例

- [ ] **Step 5: 手动检查 README 是否覆盖当前命令**

Run: `rg -n "^cli\\.command|\\.command\\(" src/cli.ts`
Expected: README 中每个对外命令都能在 `Commands` 或 `Quick Start` 找到对应说明

- [ ] **Step 6: 提交本任务**

```bash
git add README.md src/templates/defaults.ts
git commit -m "docs(readme): 补齐快速开始与命令说明"
```

---

### Task 3: 补齐标准与轻量示例 change

**Files:**
- Create: `docs/examples/standard-change/meta.json`
- Create: `docs/examples/standard-change/proposal.md`
- Create: `docs/examples/standard-change/clarification.md`
- Create: `docs/examples/standard-change/requirements.md`
- Create: `docs/examples/standard-change/design.md`
- Create: `docs/examples/standard-change/tasks.md`
- Create: `docs/examples/standard-change/test-case.md`
- Create: `docs/examples/standard-change/test-case.json`
- Create: `docs/examples/standard-change/traceability.json`
- Create: `docs/examples/lite-change/meta.json`
- Create: `docs/examples/lite-change/proposal.md`
- Create: `docs/examples/lite-change/requirements.md`
- Create: `docs/examples/lite-change/tasks.md`
- Create: `docs/examples/lite-change/test-case.md`
- Create: `docs/examples/lite-change/test-case.json`
- Create: `docs/examples/lite-change/traceability.json`

- [ ] **Step 1: 创建标准模式示例目录与文件**

标准示例建议命名为 `add-login`，并体现：

- 完整 `standard` 文档集合
- 至少一个 REQ
- 至少一个 TASK
- 至少一个 TC
- 基础 traceability 关系

- [ ] **Step 2: 创建轻量模式示例目录与文件**

轻量示例建议命名为 `fix-copy`，并体现：

- `lite` 下没有 `clarification.md` / `design.md`
- 仍保留 `requirements/tasks/test-case/traceability`
- 用小范围变更表达 `lite` 的使用边界

- [ ] **Step 3: 在 README 中链接示例目录**

实现目标：

- README 中明确指出标准与轻量示例所在位置
- 新用户可以直接照着示例理解目录结构

- [ ] **Step 4: 手动检查示例与当前模式规则一致**

Run: `find docs/examples -maxdepth 2 -type f | sort`
Expected: `standard-change` 和 `lite-change` 的文件集合符合当前 mode 规则

- [ ] **Step 5: 提交本任务**

```bash
git add docs/examples README.md
git commit -m "docs(example): 补齐 standard 和 lite 示例 change"
```

---

### Task 4: 补齐跨技术栈 checks 配置说明

**Files:**
- Create: `docs/config/python.md`
- Create: `docs/config/go.md`
- Create: `docs/config/rust.md`
- Create: `docs/faq.md`

- [ ] **Step 1: 编写 Python 配置示例**

内容应至少包含：

- `pytest`
- `ruff check .`
- 可选 `mypy`

示例配置：

```yaml
checks:
  commands:
    - id: test
      command: pytest
      required: true
    - id: lint
      command: ruff check .
      required: false
```

- [ ] **Step 2: 编写 Go 配置示例**

内容应至少包含：

- `go test ./...`
- 可选 `go vet ./...`

- [ ] **Step 3: 编写 Rust 配置示例**

内容应至少包含：

- `cargo test`
- 可选 `cargo clippy -- -D warnings`

- [ ] **Step 4: 编写 FAQ**

FAQ 至少覆盖：

- `status` 一直提示 `review` 怎么办
- `verify` 失败时看哪里
- `lite` 模式何时适合
- 如何把自己的语言命令接入 `checks.commands`

- [ ] **Step 5: 手动检查文档链接完整性**

Run: `rg -n "python|go|rust|faq" README.md docs`
Expected: README 或相关文档中能找到这些配置说明的入口

- [ ] **Step 6: 提交本任务**

```bash
git add docs/config docs/faq.md README.md
git commit -m "docs(config): 补齐跨技术栈配置说明与 FAQ"
```

---

### Task 5: 补齐发布准备与对外试用基础

**Files:**
- Modify: `package.json`
- Create: `.npmignore`
- Create: `CHANGELOG.md`
- Optionally Create: `scripts/release-check.sh`

- [ ] **Step 1: 扩展 `package.json` 发布元信息**

建议补充：

```json
{
  "description": "Spec-driven development CLI for AI coding assistant workflows",
  "license": "MIT",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "release:check": "npm run typecheck && npm run test && npm run build"
  }
}
```

- [ ] **Step 2: 创建 `.npmignore`**

```gitignore
src
tests
docs/examples
docs/superpowers
tsconfig.json
vitest.config.*
```

- [ ] **Step 3: 创建 `CHANGELOG.md`**

内容至少包含：

- `0.1.0`
- 初始 CLI 能力范围
- 已实现命令
- 当前限制

- [ ] **Step 4: 可选新增 `scripts/release-check.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

npm run typecheck
npm run test
npm run build
```

- [ ] **Step 5: 运行发布前检查**

Run: `npm run typecheck`
Expected: PASS

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: 提交本任务**

```bash
git add package.json .npmignore CHANGELOG.md scripts/release-check.sh
git commit -m "chore(release): 补齐发布元信息与检查脚本"
```

---

## Spec Coverage

本计划覆盖了 [myspec-phase-plan.md](/Users/liuhuan/workspace/coding/frontend/my-spec/docs/myspec-phase-plan.md) 中 Phase 5 的以下内容：

- 终端交互体验打磨
- 标准与轻量示例补齐
- 跨技术栈配置说明
- FAQ 和快速开始文档
- 发布准备

当前有意不覆盖的内容：

- 官网或 Web 文档站点
- CI/CD 工作流自动发布
- 复杂的版本自动化与 semver 策略
- 团队化市场分发或插件生态集成

这些内容可以作为更后续的平台化或发布运营工作继续推进。
