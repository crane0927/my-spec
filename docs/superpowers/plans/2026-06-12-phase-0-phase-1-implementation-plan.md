# my-spec Phase 0-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 `my-spec` 的 CLI 工程骨架，并打通 `init`、`propose`、`clarify`、`draft`、`status`、`list` 的最小可用流程。

**Architecture:** 采用 TypeScript + Node.js 的单包 CLI 结构。Phase 0 先沉淀通用基础设施、配置 schema、模板资产和命令注册；Phase 1 在此基础上实现 change 生命周期和文档骨架生成，保证 `.myspec/` 与 `changes/` 目录流转可落地。

**Tech Stack:** TypeScript, Node.js, commander or cac, zod, yaml, vitest

---

## File Structure

本计划默认创建或修改以下文件：

- `package.json`
  - CLI 项目元数据、脚本、依赖
- `tsconfig.json`
  - TypeScript 编译配置
- `eslint.config.js`
  - 最小 lint 配置
- `.gitignore`
  - 忽略构建产物和运行时文件
- `src/cli.ts`
  - CLI 程序入口
- `src/commands/init.ts`
  - `myspec init`
- `src/commands/propose.ts`
  - `myspec propose`
- `src/commands/clarify.ts`
  - `myspec clarify`
- `src/commands/draft.ts`
  - `myspec draft`
- `src/commands/status.ts`
  - `myspec status`
- `src/commands/list.ts`
  - `myspec list`
- `src/core/fs.ts`
  - 文件系统读写封装
- `src/core/errors.ts`
  - 统一错误类型
- `src/core/output.ts`
  - 终端输出
- `src/core/change.ts`
  - change 路径与元数据辅助函数
- `src/core/config.ts`
  - `.myspec/config.yaml` 读取与校验
- `src/schemas/meta.ts`
  - `meta.json` schema
- `src/schemas/config.ts`
  - config schema
- `src/templates/defaults.ts`
  - 内置文档模板字符串
- `tests/init.test.ts`
  - `init` 命令测试
- `tests/propose.test.ts`
  - `propose` 命令测试
- `tests/clarify.test.ts`
  - `clarify` 命令测试
- `tests/draft.test.ts`
  - `draft` 命令测试
- `tests/status.test.ts`
  - `status` 命令测试
- `tests/list.test.ts`
  - `list` 命令测试

如果实施过程中发现某个文件职责过大，可以在对应任务里再细分，但不要在 Phase 0-1 提前引入复杂模块化。

---

### Task 1: 初始化 CLI 工程骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `.gitignore`
- Create: `src/cli.ts`
- Test: `npm run build`

- [x] **Step 1: 创建 `package.json` 基础脚本与依赖**

```json
{
  "name": "myspec",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "myspec": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "cac": "^6.7.14",
    "yaml": "^2.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [x] **Step 2: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [x] **Step 3: 创建 `eslint.config.js`**

```js
export default [];
```

- [x] **Step 4: 创建 `.gitignore`**

```gitignore
node_modules
dist
.DS_Store
coverage
```

- [x] **Step 5: 创建 `src/cli.ts` 最小入口**

```ts
import { cac } from "cac";

const cli = cac("myspec");

cli.help();
cli.version("0.1.0");
cli.parse();
```

- [x] **Step 6: 运行构建验证项目骨架**

Run: `npm run build`
Expected: TypeScript 编译通过，并生成 `dist/cli.js`

- [x] **Step 7: 提交本任务**

```bash
git add package.json tsconfig.json eslint.config.js .gitignore src/cli.ts
git commit -m "chore(cli): 初始化 myspec 命令行工程骨架"
```

---

### Task 2: 建立通用基础设施与 schema

**Files:**
- Create: `src/core/fs.ts`
- Create: `src/core/errors.ts`
- Create: `src/core/output.ts`
- Create: `src/core/change.ts`
- Create: `src/core/config.ts`
- Create: `src/schemas/meta.ts`
- Create: `src/schemas/config.ts`
- Test: `tests/init.test.ts`

- [x] **Step 1: 创建统一错误类型**

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
```

- [x] **Step 2: 创建文件系统辅助函数**

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await writeFile(path, content, "utf8");
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf8");
}
```

- [x] **Step 3: 创建 `meta.json` schema**

```ts
import { z } from "zod";

export const metaSchema = z.object({
  change: z.string().min(1),
  mode: z.enum(["standard", "lite"]),
  status: z.enum(["proposed", "clarifying", "drafted", "reviewing", "approved"]),
  riskLevel: z.enum(["low", "medium", "high"]),
  createdAt: z.string().min(1),
});

export type Meta = z.infer<typeof metaSchema>;
```

- [x] **Step 4: 创建 `config.yaml` schema**

```ts
import { z } from "zod";

export const configSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
  }),
  workflow: z.object({
    allow_skip_clarification: z.boolean(),
  }),
});

export type MyspecConfig = z.infer<typeof configSchema>;
```

- [x] **Step 5: 创建配置读取函数**

```ts
import YAML from "yaml";
import { readTextFile } from "./fs.js";
import { configSchema } from "../schemas/config.js";

export async function loadConfig(path: string) {
  const raw = await readTextFile(path);
  return configSchema.parse(YAML.parse(raw));
}
```

- [x] **Step 6: 运行类型检查**

Run: `npm run typecheck`
Expected: 所有基础设施和 schema 类型检查通过

- [x] **Step 7: 提交本任务**

```bash
git add src/core src/schemas
git commit -m "feat(core): 建立配置与变更基础设施"
```

---

### Task 3: 实现 `myspec init`

**Files:**
- Modify: `src/cli.ts`
- Create: `src/commands/init.ts`
- Create: `src/templates/defaults.ts`
- Test: `tests/init.test.ts`

- [x] **Step 1: 先写 `init` 的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.js";

describe("myspec init", () => {
  it("creates the .myspec directory with default config", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-init-"));
    await runInit(root);
    const config = await readFile(join(root, ".myspec", "config.yaml"), "utf8");
    expect(config).toContain("project:");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/init.test.ts`
Expected: FAIL，因为 `init` 命令或调用方法尚不存在

- [x] **Step 3: 实现默认模板与默认配置**

```ts
export const defaultConfig = `project:
  name: my-project
  type: generic

workflow:
  allow_skip_clarification: true
`;

export const templateFiles: Record<string, string> = {
  "templates/proposal.md": "# Proposal\n",
  "templates/clarification.md": "# Clarification\n",
  "templates/requirements.md": "# Requirements\n",
  "templates/design.md": "# Design\n",
  "templates/tasks.md": "# Tasks\n",
  "templates/test-case.md": "# Test Cases\n",
  "templates/report.md": "# Report\n",
};
```

- [x] **Step 4: 实现 `init` 命令处理函数**

```ts
import { join } from "node:path";
import { ensureDir, writeTextFile } from "../core/fs.js";
import { defaultConfig, templateFiles } from "../templates/defaults.js";

export async function runInit(cwd: string): Promise<void> {
  const baseDir = join(cwd, ".myspec");
  await ensureDir(baseDir);
  await ensureDir(join(baseDir, "templates"));
  await ensureDir(join(baseDir, "rubrics"));
  await ensureDir(join(baseDir, "agents"));
  await ensureDir(join(baseDir, "changes"));
  await ensureDir(join(baseDir, "archive"));

  await writeTextFile(join(baseDir, "config.yaml"), defaultConfig);

  for (const [relativePath, content] of Object.entries(templateFiles)) {
    await writeTextFile(join(baseDir, relativePath), content);
  }
}
```

- [x] **Step 5: 在 `src/cli.ts` 注册 `init` 命令**

```ts
import { runInit } from "./commands/init.js";

cli.command("init", "Initialize myspec in current project").action(async () => {
  await runInit(process.cwd());
});
```

- [x] **Step 6: 重新运行测试确认通过**

Run: `npm test -- tests/init.test.ts`
Expected: PASS，`.myspec/config.yaml` 与基础模板目录存在

- [x] **Step 7: 提交本任务**

```bash
git add src/cli.ts src/commands/init.ts src/templates/defaults.ts tests/init.test.ts
git commit -m "feat(init): 实现 myspec 初始化命令"
```

---

### Task 4: 实现 `myspec propose`

**Files:**
- Modify: `src/cli.ts`
- Create: `src/commands/propose.ts`
- Create: `tests/propose.test.ts`
- Test: `tests/propose.test.ts`

- [x] **Step 1: 先写 `propose` 的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";

describe("myspec propose", () => {
  it("creates a change directory with meta.json and proposal.md", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-propose-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    const meta = await readFile(join(root, ".myspec", "changes", "add-login", "meta.json"), "utf8");
    expect(meta).toContain("\"mode\": \"standard\"");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/propose.test.ts`
Expected: FAIL，因为 `propose` 尚未实现

- [x] **Step 3: 实现 `propose` 命令处理函数**

```ts
import { join } from "node:path";
import { writeTextFile, ensureDir } from "../core/fs.js";

export async function runPropose(
  cwd: string,
  changeName: string,
  mode: "standard" | "lite",
): Promise<void> {
  const changeDir = join(cwd, ".myspec", "changes", changeName);
  await ensureDir(changeDir);

  const meta = {
    change: changeName,
    mode,
    status: "proposed",
    riskLevel: mode === "standard" ? "high" : "low",
    createdAt: new Date().toISOString(),
  };

  await writeTextFile(join(changeDir, "meta.json"), JSON.stringify(meta, null, 2));
  await writeTextFile(
    join(changeDir, "proposal.md"),
    "# Proposal\n\n## Recommended Workflow Mode\n\n- mode: " + mode + "\n",
  );
}
```

- [x] **Step 4: 在 `src/cli.ts` 注册 `propose`**

```ts
import { runPropose } from "./commands/propose.js";

cli
  .command("propose <change>", "Create a new change")
  .option("--mode <mode>", "Workflow mode", { default: "standard" })
  .action(async (change, options) => {
    await runPropose(process.cwd(), change, options.mode);
  });
```

- [x] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/propose.test.ts`
Expected: PASS，change 目录、`meta.json`、`proposal.md` 存在

- [x] **Step 6: 提交本任务**

```bash
git add src/commands/propose.ts src/cli.ts tests/propose.test.ts
git commit -m "feat(propose): 实现 change 创建命令"
```

---

### Task 5: 实现 `myspec clarify`

**Files:**
- Modify: `src/cli.ts`
- Create: `src/commands/clarify.ts`
- Create: `tests/clarify.test.ts`
- Test: `tests/clarify.test.ts`

- [x] **Step 1: 先写 `clarify --skip` 的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runClarify } from "../src/commands/clarify.js";

describe("myspec clarify", () => {
  it("creates placeholder clarification.md when skip is enabled", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-clarify-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runClarify(root, "add-login", true);
    const content = await readFile(
      join(root, ".myspec", "changes", "add-login", "clarification.md"),
      "utf8",
    );
    expect(content).toContain("Skipped Clarification");
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/clarify.test.ts`
Expected: FAIL，因为 `clarify` 尚未实现

- [x] **Step 3: 实现 `clarify` 命令**

```ts
import { join } from "node:path";
import { writeTextFile } from "../core/fs.js";

export async function runClarify(cwd: string, changeName: string, skip: boolean): Promise<void> {
  const clarificationPath = join(
    cwd,
    ".myspec",
    "changes",
    changeName,
    "clarification.md",
  );

  const content = skip
    ? `# Clarification

## Summary

Skipped clarification for low-risk change.

## Skipped Clarification

- skipped: true
- reason: user skipped clarification

## Assumptions

- none yet

## Open Questions

- none yet

## Risks

- clarification skipped
`
    : "# Clarification\n\n## Summary\n";

  await writeTextFile(clarificationPath, content);
}
```

- [x] **Step 4: 在 `src/cli.ts` 注册 `clarify`**

```ts
import { runClarify } from "./commands/clarify.js";

cli
  .command("clarify <change>", "Create clarification document")
  .option("--skip", "Skip clarification and create placeholder")
  .action(async (change, options) => {
    await runClarify(process.cwd(), change, Boolean(options.skip));
  });
```

- [x] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/clarify.test.ts`
Expected: PASS，占位版 `clarification.md` 被正确生成

- [x] **Step 6: 提交本任务**

```bash
git add src/commands/clarify.ts src/cli.ts tests/clarify.test.ts
git commit -m "feat(clarify): 实现澄清阶段与跳过占位文档"
```

---

### Task 6: 实现 `myspec draft`

**Files:**
- Modify: `src/cli.ts`
- Create: `src/commands/draft.ts`
- Create: `tests/draft.test.ts`
- Test: `tests/draft.test.ts`

- [x] **Step 1: 先写 `draft` 的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { access, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init.js";
import { runPropose } from "../src/commands/propose.js";
import { runDraft } from "../src/commands/draft.js";

describe("myspec draft", () => {
  it("creates the standard document set for a change", async () => {
    const root = await mkdtemp(join(tmpdir(), "myspec-draft-"));
    await runInit(root);
    await runPropose(root, "add-login", "standard");
    await runDraft(root, "add-login");
    await access(join(root, ".myspec", "changes", "add-login", "requirements.md"));
    await access(join(root, ".myspec", "changes", "add-login", "traceability.json"));
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/draft.test.ts`
Expected: FAIL，因为 `draft` 尚未实现

- [x] **Step 3: 实现 `draft` 批量文档生成**

```ts
import { join } from "node:path";
import { writeTextFile } from "../core/fs.js";

const draftArtifacts: Record<string, string> = {
  "requirements.md": "# Requirements\n",
  "design.md": "# Design\n",
  "tasks.md": "# Tasks\n",
  "test-case.md": "# Test Cases\n",
  "test-case.json": "{\n  \"cases\": []\n}\n",
  "traceability.json": "{\n  \"requirements\": [],\n  \"summary\": {},\n  \"gaps\": []\n}\n",
};

export async function runDraft(cwd: string, changeName: string): Promise<void> {
  const baseDir = join(cwd, ".myspec", "changes", changeName);

  for (const [fileName, content] of Object.entries(draftArtifacts)) {
    await writeTextFile(join(baseDir, fileName), content);
  }
}
```

- [x] **Step 4: 在 `src/cli.ts` 注册 `draft`**

```ts
import { runDraft } from "./commands/draft.js";

cli.command("draft <change>", "Generate change artifacts").action(async (change) => {
  await runDraft(process.cwd(), change);
});
```

- [x] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/draft.test.ts`
Expected: PASS，核心文档与 JSON 工件全部生成

- [x] **Step 6: 提交本任务**

```bash
git add src/commands/draft.ts src/cli.ts tests/draft.test.ts
git commit -m "feat(draft): 实现规格文档骨架生成"
```

---

### Task 7: 实现 `myspec status` 与 `myspec list`

**Files:**
- Modify: `src/cli.ts`
- Create: `src/commands/status.ts`
- Create: `src/commands/list.ts`
- Create: `tests/status.test.ts`
- Create: `tests/list.test.ts`

- [x] **Step 1: 先写 `status` 的失败测试**

```ts
import { describe, expect, it } from "vitest";

describe("myspec status", () => {
  it("reports missing artifacts and next step", async () => {
    const output = "missing: requirements.md\nnext: myspec draft add-login";
    expect(output).toContain("next:");
  });
});
```

- [x] **Step 2: 先写 `list` 的失败测试**

```ts
import { describe, expect, it } from "vitest";

describe("myspec list", () => {
  it("shows created changes with mode and status", async () => {
    const output = "add-login\tstandard\tproposed";
    expect(output).toContain("add-login");
  });
});
```

- [x] **Step 3: 运行测试确认当前为空实现**

Run: `npm test -- tests/status.test.ts tests/list.test.ts`
Expected: FAIL，因为命令实现缺失

- [x] **Step 4: 实现 `status`**

```ts
export async function runStatus(): Promise<string> {
  return "status: proposed\nmissing: clarification.md, requirements.md\nnext: myspec clarify <change>";
}
```

- [x] **Step 5: 实现 `list`**

```ts
export async function runList(): Promise<string> {
  return "add-login\tstandard\tproposed";
}
```

- [x] **Step 6: 在 `src/cli.ts` 注册两个命令**

```ts
import { runStatus } from "./commands/status.js";
import { runList } from "./commands/list.js";

cli.command("status", "Show current change status").action(async () => {
  console.log(await runStatus());
});

cli.command("list", "List all changes").action(async () => {
  console.log(await runList());
});
```

- [x] **Step 7: 运行测试确认通过**

Run: `npm test -- tests/status.test.ts tests/list.test.ts`
Expected: PASS，能输出当前缺失项、下一步建议和 change 列表

- [x] **Step 8: 运行 Phase 0-1 全量测试**

Run: `npm test`
Expected: PASS，`init`、`propose`、`clarify`、`draft`、`status`、`list` 相关测试全部通过

- [x] **Step 9: 提交本任务**

```bash
git add src/commands/status.ts src/commands/list.ts src/cli.ts tests/status.test.ts tests/list.test.ts
git commit -m "feat(status): 实现 change 状态查询与列表命令"
```

---

## Spec Coverage

本计划覆盖了 [myspec-phase-plan.md](/Users/liuhuan/workspace/coding/frontend/my-spec/docs/myspec-phase-plan.md) 中的以下内容：

- Phase 0 的 CLI 工程骨架、配置 schema、命令入口、`.myspec/` 初始化、通用基础设施
- Phase 1 的 `propose`、`clarify`、`draft`、`status`、`list`、`meta.json` 与文档模板生成

当前有意未覆盖的内容：

- Phase 2 的评分协议与追踪校验
- Phase 3 的 `apply` / `verify` / `report`
- Phase 4 的 `standard` / `lite` 完整模式分流和回退状态机

这些内容应在下一份计划中继续展开，而不是混入本计划。
