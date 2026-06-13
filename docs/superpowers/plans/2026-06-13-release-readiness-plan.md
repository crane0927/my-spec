# Myspec Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `myspec` 当前的 npm 发布阻塞项，把仓库整理到“可稳定打包、可正确执行 CLI、可重复进行发布前检查”的状态。

**Architecture:** 这次改动只做发布面上的外科手术式修复，不调整 CLI 的业务行为。核心思路是把 npm 可执行入口对齐到真实构建产物、让构建输出只包含运行时代码、把 npm cache 和 registry 约束收敛到仓库级配置，然后补一轮发布前验证与发布文档。

**Tech Stack:** TypeScript, Node.js, npm, cac, Vitest

---

## File Map

- Modify: `package.json`
- Modify: `src/cli.ts`
- Modify: `tsconfig.json`
- Create: `.npmrc`
- Modify: `README.md`
- Modify: `scripts/release-check.sh`
- Modify: `CHANGELOG.md`
- Test/Verify: `tests/cli-output.test.ts`

### Task 1: 修正 npm CLI 入口

**Files:**
- Modify: `src/cli.ts`
- Modify: `package.json`
- Test: `tests/cli-output.test.ts`

- [ ] **Step 1: 为 CLI 入口补一条失败前先能观察的验证命令**

先记录当前错误基线，确认 `bin` 入口确实不对：

```bash
node dist/cli.js --help
node dist/src/cli.js --help
```

Expected:
- 第一个命令只显示基础 help，没有 `init/propose/...` 子命令
- 第二个命令显示完整 CLI 子命令列表

- [ ] **Step 2: 给源码 CLI 入口补 shebang**

修改 `src/cli.ts` 文件头，确保编译后 npm 可执行入口可直接被 Node 调起：

```ts
#!/usr/bin/env node

import { cac } from "cac";
import { runApply } from "./commands/apply.js";
```

- [ ] **Step 3: 把 `package.json` 的 `bin` 指向真实构建产物**

把：

```json
"bin": {
  "myspec": "./dist/cli.js"
}
```

改成：

```json
"bin": {
  "myspec": "./dist/src/cli.js"
}
```

- [ ] **Step 4: 增加一个聚焦 CLI 入口的测试断言**

在 `tests/cli-output.test.ts` 中补一个最小测试，验证帮助输出含有真实命令项。示例结构：

```ts
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

describe("published cli entry", () => {
  it("shows command list from the built cli entry", () => {
    const cliPath = resolve(process.cwd(), "dist/src/cli.js");
    const output = execFileSync("node", [cliPath, "--help"], {
      encoding: "utf8",
    });

    expect(output).toContain("init");
    expect(output).toContain("review");
    expect(output).toContain("status");
  });
});
```

- [ ] **Step 5: 运行聚焦验证，确认入口修复生效**

Run:

```bash
npm run build
npm test -- tests/cli-output.test.ts
node dist/src/cli.js --help
```

Expected:
- `npm run build` 成功
- `tests/cli-output.test.ts` 通过
- `node dist/src/cli.js --help` 显示完整命令列表

- [ ] **Step 6: 提交本任务**

```bash
git add src/cli.ts package.json tests/cli-output.test.ts
git commit -m "fix(cli): 修正 npm 可执行入口"
```

### Task 2: 让构建产物只包含发布所需代码

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: 记录当前打包污染基线**

Run:

```bash
npm pack --dry-run --cache .npm-local-cache
```

Expected:
- 输出里能看到 `dist/tests/*.js`

- [ ] **Step 2: 调整 TypeScript 构建范围，不再编译测试文件**

把 `tsconfig.json` 的 `include` 从：

```json
"include": ["src/**/*.ts", "tests/**/*.ts"]
```

改成：

```json
"include": ["src/**/*.ts"]
```

保留 `compilerOptions` 不变。

- [ ] **Step 3: 保证测试仍然通过运行时方式执行**

确认 `package.json` 继续保留：

```json
"scripts": {
  "test": "vitest run",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "build": "tsc -p tsconfig.json"
}
```

如果因为 `tsconfig.json` 只编译 `src` 导致 `typecheck` 不再覆盖测试文件，则新增单独的测试类型检查脚本，但只有在实际验证失败时才加，避免过度设计。

- [ ] **Step 4: 重跑构建与打包预演**

Run:

```bash
rm -rf dist
npm run build
npm pack --dry-run --cache .npm-local-cache
```

Expected:
- `dist/` 中不再出现 `tests/`
- tarball 输出里不再包含 `dist/tests/*.js`

- [ ] **Step 5: 提交本任务**

```bash
git add tsconfig.json package.json
git commit -m "build(package): 排除测试产物进入 npm 包"
```

### Task 3: 固化项目级 npm cache 与官方 registry

**Files:**
- Create: `.npmrc`
- Modify: `scripts/release-check.sh`
- Modify: `README.md`

- [ ] **Step 1: 新增仓库级 `.npmrc`**

创建 `.npmrc`：

```ini
cache=.npm-local-cache
registry=https://registry.npmjs.org/
```

这样仓库内执行 `npm pack` / `npm publish` 时默认走项目本地 cache，并显式指向官方 npm registry。

- [ ] **Step 2: 让发布检查脚本复用仓库级 npm 配置**

保持 `scripts/release-check.sh` 简洁，但补一条打包预演：

```bash
#!/usr/bin/env bash
set -euo pipefail

npm run typecheck
npm run test
npm run build
npm pack --dry-run
```

- [ ] **Step 3: 在 README 增加发布前说明**

在 `README.md` 增加一个简短的 “Release” 或 “Publish” 小节，明确：

```md
## Release

发布前先执行：

```bash
npm run release:check
```

本仓库通过 `.npmrc` 固定：

- 使用项目内 `.npm-local-cache`
- 使用官方 npm registry：`https://registry.npmjs.org/`

首次发布前还需要人工执行：

```bash
npm login
npm publish
```
```

- [ ] **Step 4: 验证 npm 配置已生效**

Run:

```bash
npm config get cache
npm config get registry
npm run release:check
```

Expected:
- cache 指向仓库内的 `.npm-local-cache`
- registry 输出 `https://registry.npmjs.org/`
- `release:check` 完整通过

- [ ] **Step 5: 提交本任务**

```bash
git add .npmrc scripts/release-check.sh README.md
git commit -m "chore(release): 固化 npm 发布环境配置"
```

### Task 4: 更新发布文档与版本说明

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 1: 在变更日志里记录发布修复**

在 `CHANGELOG.md` 的 `0.1.0` 条目下补充发布相关说明，内容应覆盖：

```md
- 修正 npm 可执行入口，安装后可直接运行 `myspec`
- 构建产物不再包含测试文件
- 新增仓库级 npm cache / registry 配置，统一发布前检查环境
```

- [ ] **Step 2: 检查 README 中所有发布命令与当前脚本一致**

Run:

```bash
rg -n "release:check|npm pack|npm login|npm publish|registry|.npm-local-cache" README.md CHANGELOG.md scripts package.json
```

Expected:
- 文档里的命令与实际脚本、配置一致
- 没有旧的 `--cache .npm-local-cache` 临时绕过写法残留在主文档里

- [ ] **Step 3: 提交本任务**

```bash
git add README.md CHANGELOG.md
git commit -m "docs(release): 同步发布说明与变更记录"
```

### Task 5: 完整发布前验收与人工发布清单

**Files:**
- Modify: `README.md`（仅当需要补充发布结果说明）

- [ ] **Step 1: 运行完整本地发布验收**

Run:

```bash
npm run release:check
node dist/src/cli.js --help
npm pack --dry-run
```

Expected:
- `typecheck`、`test`、`build`、`pack` 全部成功
- 帮助输出显示完整命令列表
- tarball 中不包含 `dist/tests/*.js`

- [ ] **Step 2: 人工确认 npm 身份与包名可用性**

Run:

```bash
npm whoami
npm view myspec version
```

Expected:
- `npm whoami` 返回当前发布账号
- `npm view myspec version` 若返回 `404 Not Found`，表示包名仍未被占用；若返回版本号，需先改包名

- [ ] **Step 3: 手工发布**

如果是非 scoped 包：

```bash
npm publish
```

如果未来改为 scoped 包，再使用：

```bash
npm publish --access public
```

- [ ] **Step 4: 发布后回归验证**

Run:

```bash
npm view myspec version
npx myspec --help
```

Expected:
- `npm view myspec version` 返回刚发布的版本
- `npx myspec --help` 能正确显示完整命令列表

- [ ] **Step 5: 提交本任务（仅当验收阶段补了文档）**

如果 Task 5 没有新增文件改动，则跳过提交。  
如果补了文档，再执行：

```bash
git add README.md
git commit -m "docs(release): 补充发布验收说明"
```

## Self-Review

- Spec coverage:
  - 覆盖了此前确认的全部阻塞项：`bin` 指向错误、缺少 shebang、测试文件进入 npm 包、npm cache 权限绕过、registry 非官方源。
  - 覆盖了完整发布路径：本地校验、身份确认、正式发布、发布后回归。
- Placeholder scan:
  - 计划中没有 `TODO`、`TBD` 或“自行处理”的空泛步骤。
- Type consistency:
  - 全文统一使用 `dist/src/cli.js` 作为修复后的发布入口，`release:check` 作为本地发布前总入口。
