# myspec

面向个人开发流程的 SDD CLI + AI Coding Assistant 工作流框架。

`myspec` 用一组结构化文档、review 门禁、验证证据和状态流转，把一次变更从想法推进到可 review、可 apply、可 verify、可 report 的交付过程。

## Quick Start

1. 安装依赖

```bash
npm install
```

2. 构建 CLI

```bash
npm run build
```

3. 初始化当前项目

```bash
node dist/cli.js init
```

4. 创建一个 change

```bash
node dist/cli.js propose add-login --mode standard
```

5. 按当前模式补齐文档，再继续主链

```bash
node dist/cli.js clarify add-login --skip
node dist/cli.js draft add-login
node dist/cli.js review add-login
node dist/cli.js apply add-login
node dist/cli.js verify add-login
node dist/cli.js report add-login
```

6. 随时查看下一步

```bash
node dist/cli.js status add-login
```

## 最短演练流程

最短路径是：

```text
init -> propose -> clarify(standard 可跳过为占位) -> draft -> review -> apply -> verify -> report
```

推荐使用方式：

- 先用 `status` 判断当前缺什么、下一步做什么。
- `review` 用来判断规格和追踪关系是否已经达到进入实现阶段的条件。
- `verify` 用来执行项目配置中的检查命令，并沉淀验证结果与证据。

如果只是想快速体验当前 CLI，可以直接运行：

```bash
node dist/cli.js init
node dist/cli.js propose quick-fix --mode lite
node dist/cli.js draft quick-fix
node dist/cli.js status quick-fix
```

## 核心概念

### `change` 是什么

`change` 是一次独立变更的工作目录，通常放在 `.myspec/changes/<change-name>/` 下，里面包含：

- `meta.json`
- 规格文档，如 `proposal.md`、`requirements.md`
- 测试与追踪文件，如 `test-case.json`、`traceability.json`
- review、verify、report 产物

### `standard` 与 `lite` 的区别

- `standard`：适用于高风险、跨模块、需要设计和澄清的变更，默认包含 `clarification.md`、`design.md`。
- `lite`：适用于低风险、小范围改动，不要求 `clarification.md` 和 `design.md`，但仍保留 requirements、tasks、test cases、traceability。

### `review` 与 `verify` 的区别

- `review`：检查规格文档是否完整、模式是否匹配、追踪关系是否可进入 apply。
- `verify`：执行项目级检查命令，记录测试、lint、构建等验证结果。

## 示例目录

- 标准模式示例：`docs/examples/standard-change/`
- 轻量模式示例：`docs/examples/lite-change/`

如果你想先理解目录结构，再开始在自己的项目里使用 `myspec`，建议先对照这两套示例查看 `proposal -> requirements -> tasks -> test-case -> traceability` 的最小骨架。

## 配置与排障

- Python checks 示例：`docs/config/python.md`
- Go checks 示例：`docs/config/go.md`
- Rust checks 示例：`docs/config/rust.md`
- 常见问题：`docs/faq.md`

## Commands

- `myspec init`
- `myspec propose <change> --mode <standard|lite>`
- `myspec clarify <change> [--skip]`
- `myspec draft <change>`
- `myspec apply <change>`
- `myspec review <change>`
- `myspec verify <change>`
- `myspec report <change>`
- `myspec status <change>`
- `myspec list`

当前仓库里可直接使用 `node dist/cli.js ...` 代替全局安装后的 `myspec ...`。

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
