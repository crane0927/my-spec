# my-spec 产品与技术设计文档

> 版本：v2.2
> 状态：定稿
> 定位：面向个人开发流程的通用 SDD CLI + AI Coding Assistant 工作流框架

---

## 1. 本版修订目标

v2.2 在保留 v2.1 核心思路的基础上，重点解决以下问题：

- 小改动场景流程过重，首次使用门槛偏高。
- 文档评分规则定义了目标，但缺少稳定的评分协议。
- `apply`、`verify` 失败后的回退路径不够清晰。
- 追踪、证据、报告更偏向“可检查”，但还不够“可解释”。

本版修订不追求引入更多新能力，而是优先补齐产品化落地所需的四个关键缺口：

- 何时使用轻量流程
- 如何稳定评分
- 失败后如何回退
- 如何统一保存和消费证据

---

## 2. 产品定位

`my-spec` 不是独立的 autonomous coding agent。

它的定位是：

> 一个通用的 SDD CLI + AI coding assistant 工作流框架，用结构化文档、评分门禁、追踪关系、测试执行和鲁棒性验证，约束 Claude Code、Cursor、Codex 等 AI coding assistant 的开发过程。

### 2.1 核心目标

`my-spec` 的核心目标是把一次变更从模糊想法推进到可验证、可追踪、可归档的完整过程：

```text
想法
-> 提案
-> 澄清
-> 需求
-> 设计
-> 任务
-> 测试用例
-> AI 实现
-> 测试执行
-> 鲁棒性验证
-> 报告
-> 归档
```

### 2.2 使用模式

v2.2 将流程分为两种模式：

- `standard`：适用于跨模块、核心业务、架构调整、认证权限、兼容性敏感或高风险变更。
- `lite`：适用于小改动、低风险、单模块、边界清晰的局部增强或缺陷修复。

设计原则不是让所有变更都走最重流程，而是让流程成本与变更风险匹配。

### 2.3 和 OpenSpec 的关系

`my-spec` 参考 OpenSpec 的技术栈和工作流形态，但更强调个人质量门禁、失败回退和验证证据。

| 维度 | OpenSpec | my-spec |
| --- | --- | --- |
| 产品形态 | SDD CLI + AI assistant workflow | SDD CLI + 质量门禁 workflow |
| 使用对象 | AI coding assistants / agents / humans | 个人开发者 + AI coding assistants |
| 工作流重点 | artifact-guided workflow | 澄清、评分、验证、报告、失败回退 |
| apply 阶段 | `/opsx:apply` 实现任务 | `/myspec:apply` 调用 AI assistant 实现代码和测试 |
| verify 阶段 | 验证实现与 artifacts 对齐 | 验证需求、测试、代码质量、鲁棒性和证据 |
| 项目限制 | 通用，不限制语言框架 | 通用，不限制语言框架 |

---

## 3. 设计原则

### 3.1 不限制项目类型

`my-spec` 不绑定具体语言、框架或项目结构。

它可以用于：

- JavaScript / TypeScript
- Python
- Go
- Rust
- Java
- CLI 工具
- Web 应用
- 后端服务
- 库项目
- 文档型项目

项目相关的检查命令通过 `config.yaml` 配置。

### 3.2 CLI 与 AI Assistant 分工

#### CLI 能力

CLI 负责确定性和可管理的动作：

- 初始化项目
- 创建 change 目录
- 校验文档结构
- 检查状态
- 执行本地命令
- 生成 JSON 结果
- 生成报告
- 归档

#### Slash Command / Agent 能力

AI coding assistant 负责需要理解上下文和修改代码的动作：

- 需求澄清
- 文档生成
- 文档评分建议
- 应用变更
- 编写功能代码
- 编写测试代码
- 分析鲁棒性问题
- 生成修复建议

### 3.3 规格先于实现

在代码实现前，必须先生成与当前模式匹配的规格文档并通过 gate。

- `standard` 默认要求完整规格链路。
- `lite` 可以减少中间文档，但不能跳过需求、任务、测试和验证。

### 3.4 流程成本与风险匹配

变更流程不应一刀切。

- 高风险变更应优先保证完整性和可追溯性。
- 低风险变更应优先降低流程摩擦，但不能牺牲基本验证能力。

### 3.5 失败可恢复优先于线性完美流转

阶段失败不是异常情况，而是工作流的一部分。

因此每个关键阶段都应定义：

- 失败信号
- 阻塞条件
- 回退目标阶段
- 修复后如何重新进入主流程

### 3.6 机器可校验与人可理解并重

`my-spec` 的 Markdown 和 JSON 产物应同时满足两类使用者：

- CLI / agent / CI 等自动流程
- 开发者本人在评审、排障和复盘时的理解需求

---

## 4. 技术架构

### 4.1 推荐技术栈

参考 OpenSpec，`my-spec` 推荐使用 TypeScript + Node.js 实现。

| 类别 | 推荐技术 |
| --- | --- |
| 主要语言 | TypeScript |
| 运行环境 | Node.js |
| CLI 框架 | commander / cac |
| 交互式 CLI | @inquirer/prompts |
| 命令行输出 | chalk / ora |
| 文件扫描 | fast-glob |
| 数据校验 | zod |
| YAML 解析 | yaml |
| Markdown 处理 | remark / markdown-it |
| 测试框架 | vitest |
| 代码质量 | eslint / typescript-eslint |
| 发布管理 | changesets |

### 4.2 架构分层

```text
CLI Layer
- 命令解析
- 参数处理
- 交互式输入
- 输出格式

Workflow Engine
- 状态机
- 阶段流转
- 模式选择
- Gate 判断
- 回退策略
- 错误处理

Document Engine
- 模板渲染
- Markdown 生成
- JSON 结构生成
- 文档完整性校验

Scoring Engine
- 多角色评分
- 多维度评分
- 评分协议执行
- Blocking issue 判断

Traceability Engine
- REQ -> TASK -> TC 映射
- 覆盖关系检查
- 缺失关系检测
- 覆盖缺口汇总

Execution Engine
- 读取 config.yaml
- 执行本地命令
- 捕获 stdout / stderr / exit code
- 生成 checks.json
- 采集执行证据

Verification Engine
- 文档验证
- 评分验证
- 测试执行验证
- 代码质量检查
- 鲁棒性检查
- 安全性检查
- 证据完整性检查
- 生成 verification.json

AI Adapter Layer
- Claude Code
- Cursor
- Codex
- 通用 AGENTS.md

Report Engine
- 汇总 Markdown 报告
- 汇总 JSON 报告
- 风险与遗留问题记录
- 覆盖缺口与证据摘要
```

---

## 5. 核心目录结构

```text
.myspec/
  config.yaml
  constitution.md

  templates/
    proposal.md
    clarification.md
    requirements.md
    design.md
    tasks.md
    test-case.md
    report.md

  rubrics/
    proposal.yaml
    clarification.yaml
    requirements.yaml
    design.yaml
    tasks.yaml
    test-case.yaml

  agents/
    common.md
    claude.md
    cursor.md
    codex.md

  changes/
    add-login/
      meta.json

      proposal.md
      clarification.md
      requirements.md
      design.md
      tasks.md
      test-case.md
      test-case.json
      traceability.json

      scores/
        proposal.score.json
        clarification.score.json
        requirements.score.json
        design.score.json
        tasks.score.json
        test-case.score.json
        review-summary.json

      verification/
        checks.json
        verification.json
        robustness.json
        evidence.json
        coverage-summary.json

      report.md
      report.json

  archive/
    2026-06-07-add-login/
```

### 5.1 meta.json 关键字段

`meta.json` 至少应包含：

```json
{
  "change": "add-login",
  "mode": "standard",
  "status": "proposed",
  "riskLevel": "high",
  "createdAt": "2026-06-12T10:00:00Z"
}
```

其中：

- `mode` 用于声明 `standard` 或 `lite`
- `riskLevel` 用于支持流程选择和 gate 提示

---

## 6. 主流程

### 6.1 standard 流程

标准流程适用于高风险或中高复杂度变更：

```text
proposal
-> clarification
-> requirements
-> design
-> tasks
-> test-case
-> review
-> apply
-> verify
-> report
-> archive
```

### 6.2 lite 流程

轻量流程适用于边界清晰、低风险、小范围变更：

```text
proposal
-> requirements
-> tasks
-> test-case
-> review
-> apply
-> verify
-> report
```

`lite` 流程允许省略独立的 `clarification.md` 和 `design.md` 深度展开，但以下内容仍必须存在：

- 明确需求
- 明确任务拆分
- 明确测试映射
- 明确验证结果
- 明确风险说明

### 6.3 流程选择规则

满足以下任一条件时，必须使用 `standard`：

- 涉及认证、权限、数据边界
- 涉及架构调整或跨模块改动
- 涉及兼容性风险或迁移风险
- 涉及并发、幂等性、事务一致性
- 涉及公共接口、SDK、CLI 命令行为变化

满足以下条件时，可考虑 `lite`：

- 单模块改动
- 非核心路径优化
- 边界与验收标准明确
- 不涉及权限和敏感数据
- 可通过现有测试命令直接验证

### 6.4 澄清阶段允许跳过

`my-spec` 允许跳过需求澄清，但应生成最小占位文档，而不是完全缺失 `clarification.md`。

占位文档至少包含：

```markdown
# Clarification

## Summary

Skipped clarification for low-risk change.

## Skipped Clarification

- skipped: true
- reason: user skipped clarification

## Assumptions

- ...

## Open Questions

- ...

## Risks

- ...
```

这样可以保证：

- 目录结构一致
- 状态机一致
- review 入口一致
- 报告和归档更完整

### 6.5 阶段职责边界

```text
proposal.md       = 为什么做
clarification.md  = 哪些点被问清楚，哪些点仍有风险
requirements.md   = 最终必须满足什么
design.md         = 为什么这样设计，以及不这样设计的代价
tasks.md          = 怎么拆分和落地实现
test-case.md      = 如何验证，以及验证到什么程度
traceability.json = 如何证明 REQ/TASK/TC 互相关联
evidence.json     = 如何证明本次实现和验证真正发生过
```

---

## 7. 核心文档设计

### 7.1 proposal.md

`proposal.md` 描述变更动机、目标和范围。

建议结构：

```markdown
# Proposal

## Background

## Problem

## Goals

## Non-goals

## Scope

## Impact

## Risks

## Recommended Workflow Mode
```

新增要求：

- 应明确推荐使用 `standard` 还是 `lite`
- 应说明推荐依据

### 7.2 clarification.md

`clarification.md` 记录需求澄清过程或跳过澄清的依据。

建议结构：

```markdown
# Clarification

## Summary

## Questions and Answers

### Q1

Question:
Answer:
Decision:

## Assumptions

## Open Questions

## Skipped Clarification

## Risks
```

要求：

- 不做 Level 0-3 分级
- 跳过时也必须生成占位文档
- 未确认项应显式记录在 `Open Questions` 或 `Risks`

### 7.3 requirements.md

`requirements.md` 是最终需求文档，也是后续任务、测试和验证的核心来源。

建议结构：

```markdown
# Requirements

## Overview

## Requirements

### REQ-001: 用户可以通过邮箱和密码登录

Priority: P0
Status: approved
Source: clarification.md#Q1

#### Description

#### Acceptance Criteria

- ...

#### Business Rules

- ...

#### Edge Cases

- ...

#### Non-goals

- ...
```

新增要求：

- 每条 P0/P1 需求必须有明确验收标准
- 每条需求必须可测试、可追踪、可解释
- 对于模糊需求，应在 review 阶段判定为文档质量问题，而不是实现阶段隐式猜测

### 7.4 design.md

`design.md` 描述技术方案和关键设计权衡。

建议结构：

```markdown
# Design

## Overview

## Architecture

## Technical Decisions

## Data Model

## API / Interface Changes

## Compatibility

## Security Considerations

## Alternatives Considered

## Risks
```

新增要求：

- 对复杂变更应记录 rejected alternatives
- 对兼容性或迁移风险应说明回滚思路
- 对不可实现或高风险设计应允许在 review 后回退修订

### 7.5 tasks.md

`tasks.md` 拆分实现任务。

建议结构：

```markdown
# Tasks

## TASK-001 实现登录 API

Status: pending
Requirements:
- REQ-001

Test Cases:
- TC-001
- TC-002

Depends On:
- TASK-000

Steps:
- [ ] ...
- [ ] ...

Done Definition:
- 已实现功能代码
- 已补充对应测试
- 已更新证据

Evidence:
- src/...
- tests/...
```

新增要求：

- 每个 TASK 必须至少绑定一个 REQ 和一个 TC
- 每个 TASK 应有 `Done Definition`
- 对存在执行顺序要求的任务，应显式声明 `Depends On`

### 7.6 test-case.md

`test-case.md` 是测试规格，不是测试代码。

建议结构：

```markdown
# Test Cases

## TC-001 用户可以成功登录

Requirement:
- REQ-001

Task:
- TASK-001

Type:
- integration

Priority:
- P0

Preconditions:
- 用户已注册

Steps:
1. 输入正确邮箱和密码
2. 点击登录按钮

Expected Result:
- 登录成功

Execution Mapping:
- mode: automated
- commandId: test:login
- testFile: tests/login.test.ts
- status: pending
```

执行映射新增约定：

- `mode: automated`
- `mode: semi-automated`
- `mode: manual`

要求：

- `automated` 必须声明 `commandId` 和测试文件路径
- `manual` 必须声明手工验证步骤和证据要求
- P0/P1 测试默认应自动化，若无法自动化必须说明原因

### 7.7 test-case.json

`test-case.json` 是测试用例的机器可读结构。

示例：

```json
{
  "cases": [
    {
      "id": "TC-001",
      "title": "用户可以成功登录",
      "requirements": ["REQ-001"],
      "tasks": ["TASK-001"],
      "type": "integration",
      "priority": "P0",
      "executionMode": "automated",
      "commands": ["test:login"],
      "files": ["tests/login.test.ts"],
      "status": "pending"
    }
  ]
}
```

### 7.8 traceability.json

`traceability.json` 除了记录关系，还应支持覆盖缺口分析。

示例：

```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "tasks": ["TASK-001"],
      "tests": ["TC-001"],
      "status": "covered"
    }
  ],
  "summary": {
    "totalRequirements": 1,
    "fullyCovered": 1,
    "partiallyCovered": 0,
    "uncovered": 0
  },
  "gaps": []
}
```

要求：

- 每个 REQ 至少绑定一个 TASK
- 每个 REQ 至少绑定一个 TC
- 每个 TASK 至少绑定一个 TC
- 应能输出 `gaps` 和 `summary`

### 7.9 evidence.json

`evidence.json` 用于统一记录实现、测试和人工验证证据。

建议结构：

```json
{
  "items": [
    {
      "id": "EV-001",
      "type": "command",
      "source": "verify",
      "relatedRequirements": ["REQ-001"],
      "relatedTasks": ["TASK-001"],
      "relatedTestCases": ["TC-001"],
      "payload": {
        "commandId": "test:login",
        "exitCode": 0
      }
    }
  ]
}
```

证据类型建议包含：

- `file`
- `command`
- `test`
- `manual-check`
- `risk-acceptance`

---

## 8. 文档评分

### 8.1 评分机制

```bash
myspec review <change-name>
```

或：

```text
/myspec:review <change-name>
```

`my-spec` 对每个文档进行多角色、多维度评分。

评分规则：

- 总分为 100
- 每个维度不得低于 80
- Level 3 问题一票否决
- 评分不通过时，不允许进入 `apply`

### 8.2 角色

建议角色：

- CEO Reviewer
- Design Reviewer
- Engineering Reviewer
- QA Reviewer
- Security Reviewer
- DevEx Reviewer

### 8.3 文档评分维度

| 文档 | 评分维度 |
| --- | --- |
| `proposal.md` | 目标清晰度、价值、范围边界、影响面、风险 |
| `clarification.md` | 问题覆盖度、回答明确度、假设记录、风险暴露 |
| `requirements.md` | 完整性、可验证性、优先级、验收标准、边界条件 |
| `design.md` | 架构一致性、复杂度、可维护性、安全性、兼容性 |
| `tasks.md` | 可执行性、拆分粒度、依赖顺序、可追踪性 |
| `test-case.md` | 覆盖率、边界场景、异常场景、执行映射、可追踪性 |

### 8.4 评分协议

为减少不同 AI assistant 的评分漂移，v2.2 应引入统一评分协议：

- 每个 reviewer 独立输出评分结果
- 每个 reviewer 必须给出维度分、总分、问题列表、阻塞判断
- 汇总层负责合并 reviewer 结果，而不是由单个 reviewer 直接给最终结论

建议汇总规则：

- 文档总分 = 加权平均或简单平均
- 任一 reviewer 标记 Level 3 时直接阻塞
- 任一关键维度低于 80 时判定失败

### 8.5 score schema

建议每个评分文件结构如下：

```json
{
  "document": "requirements.md",
  "reviewer": "Engineering Reviewer",
  "overall": 88,
  "pass": true,
  "dimensionScores": {
    "completeness": 90,
    "testability": 86,
    "traceability": 88
  },
  "issues": [
    {
      "level": 1,
      "category": "clarity",
      "title": "REQ-003 描述不够具体",
      "suggestion": "补充输入边界和错误行为。"
    }
  ],
  "blockingIssues": []
}
```

### 8.6 review 失败后的推荐动作

评分失败后，系统应给出建议回退目标：

- 需求不清楚：回到 `clarify` 或 `requirements`
- 设计不可维护：回到 `design`
- 任务拆分不合理：回到 `tasks`
- 测试映射不足：回到 `test-case`

---

## 9. 检查问题分级

Level 0-3 只用于检查结果，不用于定义需求本身。

| 等级 | 含义 | 是否阻塞 |
| --- | --- | --- |
| Level 0 | 优化建议，不影响正确性 | 否 |
| Level 1 | 轻微问题，不影响核心功能 | 否 |
| Level 2 | 明显风险，需要修复或在报告中说明 | 默认不阻塞，可配置 |
| Level 3 | 阻塞问题，影响核心需求、测试可信度、安全性或数据正确性 | 是 |

### 9.1 issue schema 建议字段

每条 issue 建议包含：

- `level`
- `category`
- `source`
- `title`
- `description`
- `relatedRequirements`
- `relatedTasks`
- `relatedTestCases`
- `suggestion`
- `recommendedAction`

其中 `recommendedAction` 可取：

- `fix-now`
- `document-risk`
- `defer-with-approval`

---

## 10. apply

### 10.1 apply 阶段定位

```bash
myspec apply <change-name>
```

`apply` 阶段不是简单生成 prompt，而是由当前 AI coding assistant 根据已确认的规格文档执行实现。

职责：

- 读取当前 change 的规格文档
- 按 `tasks.md` 实现功能代码
- 按 `test-case.md` / `test-case.json` 实现测试代码
- 更新任务状态和测试证据
- 在遇到阻塞条件时停止并回退

### 10.2 apply 进入条件

- 当前模式所要求的文档存在
- 所有文档评分维度 >= 80
- 文档评分通过
- `traceability.json` 完整
- 测试映射完整

### 10.3 apply 执行要求

- 严格按 `tasks.md` 执行
- 同时实现功能代码和测试代码
- 不得跳过 P0/P1 测试
- 不得修改无关范围
- 完成后更新任务状态和 evidence

### 10.4 apply 中断与回退

遇到以下情况应停止 `apply`：

- 需求冲突
- 设计不可实现
- 任务拆分无法执行
- 测试映射缺失
- 出现 Level 3 阻塞问题

回退建议：

- 需求冲突：回退到 `requirements`
- 设计不可实现：回退到 `design`
- 任务拆分不合理：回退到 `tasks`
- 测试映射缺失：回退到 `test-case`

### 10.5 apply 输出契约

`apply` 结束时至少应更新：

- `tasks.md` 状态
- `test-case.md` 执行状态
- `evidence.json`
- 与实现相关的文件证据

---

## 11. verify

### 11.1 verify 阶段定位

```bash
myspec verify <change-name>
```

验证阶段用于确认当前 change 是否真正满足需求，并检查实现结果是否具备基本质量和鲁棒性。

### 11.2 验证范围

验证不只包括测试是否通过，还应覆盖：

- 需求追踪
- 测试执行
- 代码基础质量
- 异常处理
- 边界条件
- 安全风险
- 鲁棒性
- 证据完整性

### 11.3 需求追踪检查

- 检查 `REQ -> TASK -> TC` 是否完整
- 检查是否存在 orphan requirement / task / test case
- 输出覆盖摘要和缺口摘要

### 11.4 测试执行检查

- 检查 `test-case.json` 中的执行映射是否完整
- 检查测试文件是否存在
- 检查测试命令 ID 是否存在于 `config.yaml`
- 执行测试命令
- 记录 `checks.json`
- P0/P1 测试失败时，标记为 Level 3

### 11.5 代码基础质量检查

执行项目配置的基础质量命令，例如：

- typecheck
- lint
- format check
- build
- unit test
- integration test
- e2e test
- dependency audit

### 11.6 代码鲁棒性检查

重点检查：

- 输入校验是否充分
- 异常路径是否有明确处理
- 并发、幂等性、超时、重试是否被考虑
- 核心边界测试是否存在
- 是否只覆盖 happy path
- 是否存在资源泄漏、兼容性破坏或敏感信息泄露风险

### 11.7 证据完整性检查

`verify` 应检查证据是否足以支持最终结论。

至少包括：

- 是否有命令执行结果
- 是否有测试文件或测试结果证据
- 手工验证是否有步骤和结果
- 已接受风险是否有说明

### 11.8 verification.json 建议结构

```json
{
  "change": "add-login",
  "status": "failed",
  "mode": "standard",
  "gates": {
    "traceability": "passed",
    "testExecution": "passed",
    "codeQuality": "passed",
    "robustness": "failed",
    "security": "warning",
    "evidence": "passed"
  },
  "coverageSummary": {
    "requirements": {
      "total": 3,
      "covered": 2,
      "uncovered": 1
    }
  },
  "issues": []
}
```

---

## 12. 配置设计

### 12.1 config.yaml

```yaml
project:
  name: my-project
  type: generic

workflow:
  mode:
    default: standard
    allow_lite_for:
      - docs
      - small-fix
      - refactor-safe
  allow_skip_clarification: true
  require_human_approval: false

score:
  scale: 100
  dimension_min: 80
  blocking_issue_level: 3

review:
  roles:
    - engineering
    - qa
  weights:
    engineering: 0.5
    qa: 0.5

requirements:
  require_task_link: true
  require_test_link: true

checks:
  commands:
    - id: typecheck
      name: Type check
      command: npm run typecheck
      required: false

    - id: test
      name: Run tests
      command: npm test
      required: true

test:
  require_executable_cases: true
  require_case_command_mapping: true
  require_all_cases_checked: true
  p0_p1_should_be_automated: true

verification:
  mode: hybrid
  require_traceability: true
  require_test_execution: true
  require_robustness_check: true
  require_evidence: true
  collect_file_evidence: true

evidence:
  required_types:
    - command
    - test

agents:
  default: claude
  supported:
    - claude
    - cursor
    - codex
```

---

## 13. 命令设计

### 13.1 CLI 命令

```bash
myspec init
myspec propose <change>
myspec clarify <change>
myspec draft <change>
myspec review <change>
myspec apply <change>
myspec verify <change>
myspec report <change>
myspec archive <change>
myspec status
myspec list
```

### 13.2 可选参数建议

```bash
myspec propose <change> --mode standard
myspec propose <change> --mode lite
myspec review <change> --reviewers engineering,qa
myspec verify <change> --include-manual-checks
```

---

## 14. 状态机

### 14.1 状态

建议状态：

```text
new
proposed
clarifying
drafted
reviewing
approved
applying
implemented
verifying
verified
reported
archived
needs-revision
rejected
```

### 14.2 主流转

```text
new
-> proposed
-> clarifying
-> drafted
-> reviewing
-> approved
-> applying
-> implemented
-> verifying
-> verified
-> reported
-> archived
```

### 14.3 回退流转

```text
clarifying -> proposed
reviewing -> drafted
applying -> drafted
applying -> reviewing
verifying -> applying
verifying -> drafted
```

### 14.4 Gate 规则

| 流转 | 条件 |
| --- | --- |
| proposed -> clarifying | proposal.md 存在 |
| clarifying -> drafted | clarification 完成，或已生成最小占位文档 |
| drafted -> reviewing | 当前模式所需文档存在 |
| reviewing -> approved | 所有文档评分维度 >= 80，且无 Level 3 |
| approved -> applying | traceability 完整，测试映射完整 |
| applying -> implemented | tasks 状态完成，测试证据存在 |
| implemented -> verifying | 实现证据和测试证据存在 |
| verifying -> verified | 测试通过，代码审查/鲁棒性/安全检查无 Level 3，证据完整 |
| verified -> reported | verification.json 存在 |
| reported -> archived | report.md / report.json 存在 |

---

## 15. 报告

### 15.1 report.md

报告面向人类阅读。

内容包括：

- 变更摘要
- 使用流程模式：`standard` / `lite`
- 最终需求列表
- 实现摘要
- 测试摘要
- 文档评分结果
- 验证结果
- 覆盖缺口摘要
- 证据摘要
- 鲁棒性检查结果
- 安全检查结果
- 未验证项
- 风险和遗留问题
- 关键设计决策
- 修改文件证据
- 后续建议

### 15.2 report.json

报告面向机器处理。

建议结构：

```json
{
  "change": "add-login",
  "mode": "standard",
  "status": "verified",
  "requirements": [],
  "tasks": [],
  "tests": [],
  "scores": {},
  "verification": {},
  "coverageSummary": {},
  "evidenceSummary": {},
  "robustness": {},
  "risks": [],
  "unverifiedItems": [],
  "artifacts": []
}
```

---

## 16. 归档

```bash
myspec archive <change-name>
```

第一版仍不集成 Git。

归档行为：

- 检查 report 是否存在
- 检查 verification 是否通过
- 检查是否存在未处理 Level 3
- 移动 change 到 `.myspec/archive/`
- 保留 Markdown 和 JSON 产物
- 保留评分、验证、鲁棒性和报告历史

---

## 17. MVP 范围建议调整

### 17.1 第一版必须包含

- `myspec init`
- `myspec propose`
- `myspec review`
- `myspec apply`
- `myspec verify`
- `myspec report`
- 通用项目支持
- `requirements.md`
- `tasks.md`
- `test-case.md` / `test-case.json`
- `traceability.json`
- 多维度评分
- 基础证据模型
- `checks.json`
- `verification.json`
- `report.md` / `report.json`

### 17.2 第一版建议延后

- 深度 `clarification` 自动化
- 完整 `design.md` 高级模板
- 复杂评分历史趋势分析
- AST 级代码分析
- mutation testing
- fuzz testing
- 多 agent 协作

说明：

如果 MVP 同时追求“完整流程 + 高级评分 + 复杂验证 + 全量报告”，交付风险会明显升高。v2.2 建议优先保证主链路闭环可用，再逐步扩展高级能力。

---

## 18. 附录建议

### 18.1 流程选择决策表

补充一个决策表，回答：

- 什么场景用 `lite`
- 什么场景强制 `standard`
- 什么场景必须补澄清

### 18.2 评分与 issue schema

补充统一 schema，减少 reviewer 结果风格漂移。

### 18.3 evidence schema

补充统一证据结构，避免不同阶段各自定义、彼此不兼容。

### 18.4 典型回退案例

补充典型案例：

- review 不通过如何回到 draft
- apply 发现需求冲突如何回到 requirements
- verify 发现 Level 3 如何回到 apply 或 draft

---

## 19. 修订结论

v2.2 的核心不是增加更多命令，而是让 `my-spec` 从“理念完整”变成“流程可执行、失败可恢复、结果可解释”：

1. 用 `standard` / `lite` 分层控制流程成本
2. 用统一评分协议减少 reviewer 漂移
3. 用显式回退状态提升失败恢复能力
4. 用统一证据模型支撑验证与报告
5. 用覆盖摘要和未验证项提升结果解释性

这几项能力补齐后，`my-spec` 会更像一个真正可长期使用的个人 SDD 工作流框架，而不只是一个概念上完备的设计方案。
