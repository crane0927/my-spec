# myspec 产品与技术设计文档

> 版本：v2.1  
> 定位：面向个人开发流程的通用 SDD CLI + AI Coding Assistant 工作流框架

---

## 1. 背景

`myspec` 是一个类似 OpenSpec 的 Spec-Driven Development（SDD）CLI 工具。

它参考 OpenSpec 的整体形态：通过 CLI 初始化项目、管理规格文档、检查状态、验证产物，并通过 AI coding assistant 的 slash command 执行规划与实现。

OpenSpec 的公开文档显示，它支持 artifact-driven OPSX 工作流，并提供 `/opsx:propose`、`/opsx:explore`、`/opsx:apply`、`/opsx:verify`、`/opsx:archive` 等命令。其中 `/opsx:apply` 用于实现任务并按需更新 artifacts，`/opsx:verify` 用于根据 artifacts 验证实现结果。

myspec 在此基础上，增加更贴合个人开发习惯的质量门禁：

- 需求澄清
- 最终需求文档
- 多角色、多维度文档评分
- 需求、任务、测试用例追踪
- 测试用例执行映射
- 代码鲁棒性检查
- 测试执行验证
- Markdown + JSON 总结报告
- 归档

---

## 2. 产品定位

myspec 不是独立的 autonomous coding agent。

myspec 的定位是：

> 一个通用的 SDD CLI + AI coding assistant 工作流框架，用结构化文档、评分门禁、追踪关系、测试执行和鲁棒性验证，约束 Claude Code、Cursor、Codex 等 AI coding assistant 的开发过程。

### 2.1 核心目标

myspec 的核心目标是把一次变更从模糊想法推进到可验证、可追踪、可归档的完整过程：

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

### 2.2 和 OpenSpec 的关系

myspec 参考 OpenSpec 的技术栈和工作流形态，但更强调个人质量门禁。

| 维度 | OpenSpec | myspec |
| --- | --- | --- |
| 产品形态 | SDD CLI + AI assistant workflow | SDD CLI + 质量门禁 workflow |
| 使用对象 | AI coding assistants / agents / humans | 个人开发者 + AI coding assistants |
| 工作流重点 | artifact-guided workflow | 澄清、评分、验证、报告 |
| apply 阶段 | `/opsx:apply` 实现任务 | `/myspec:apply` 调用 AI assistant 实现代码和测试 |
| verify 阶段 | 验证实现与 artifacts 对齐 | 验证需求、测试、代码质量和鲁棒性 |
| 项目限制 | 通用，不限制语言框架 | 通用，不限制语言框架 |

---

## 3. 设计原则

### 3.1 不限制项目类型

myspec 不绑定具体语言、框架或项目结构。

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

myspec 分为两类能力：

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

在代码实现前，必须先生成并通过评分门禁的规格文档：

- `proposal.md`
- `clarification.md`
- `requirements.md`
- `design.md`
- `tasks.md`
- `test-case.md`
- `test-case.json`
- `traceability.json`

### 3.4 每个阶段必须有退出条件

myspec 不只生成文档，而是通过 gate 控制阶段流转。

例如：

- 文档评分未达标，不允许 apply。
- REQ 没有 TASK 或 TC，不允许 verify 通过。
- 测试命令失败，不允许归档。
- 代码审查、测试执行、鲁棒性检查中发现 Level 3 问题，不允许通过验证。

---

## 4. 技术架构

### 4.1 推荐技术栈

参考 OpenSpec，myspec 推荐使用 TypeScript + Node.js 实现。

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
- Gate 判断
- 错误处理

Document Engine
- 模板渲染
- Markdown 生成
- JSON 结构生成
- 文档完整性校验

Scoring Engine
- 多角色评分
- 多维度评分
- 代码审查与验证问题分级
- Blocking issue 判断

Traceability Engine
- REQ -> TASK -> TC 映射
- 覆盖关系检查
- 缺失关系检测

Execution Engine
- 读取 config.yaml
- 执行本地命令
- 捕获 stdout / stderr / exit code
- 生成 checks.json

Verification Engine
- 文档验证
- 评分验证
- 测试执行验证
- 代码质量检查
- 鲁棒性检查
- 安全性检查
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

      verification/
        checks.json
        verification.json
        robustness.json
        evidence.json

      report.md
      report.json

  archive/
    2026-06-07-add-login/
```

---

## 6. 主流程

### 6.1 创建提案

创建一个新的 change。

```bash
myspec propose <change-name>
```

或在 AI assistant 中：

```text
/myspec:propose <change-name>
```

产物：

- change 目录
- `meta.json`
- 初始 `proposal.md`

`proposal.md` 负责回答：

- 为什么要做？
- 目标是什么？
- 影响范围是什么？
- 非目标是什么？
- 初步风险是什么？

---

### 6.2 需求澄清

```bash
myspec clarify <change-name>
```

或：

```text
/myspec:clarify <change-name>
```

需求澄清参考 grill-me 的思路，通过连续追问暴露需求中的不明确点、风险点和隐藏假设。该阶段只记录澄清信息，不对需求或澄清问题进行 Level 0-3 分级。

澄清问题类型：

- 目标问题
- 范围问题
- 用户行为问题
- 业务规则问题
- 技术约束问题
- 边界场景问题
- 验收标准问题
- 安全与权限问题
- 测试与验证问题

产物：

- `clarification.md`

#### 允许跳过

myspec 允许跳过需求澄清，但必须记录风险。

```bash
myspec clarify <change-name> --skip
```

跳过后应记录：

```json
{
  "clarification": {
    "skipped": true,
    "riskStatus": "unconfirmed",
    "reason": "user skipped clarification",
    "openQuestions": []
  }
}
```

需求澄清阶段不做 Level 0-3 问题分级；跳过澄清只记录未确认项、假设和风险。后续如果这些风险导致实现或验证问题，再在代码审查、测试验证或鲁棒性检查结果中分级。

---

### 6.3 生成文档

```bash
myspec draft <change-name>
```

或：

```text
/myspec:draft <change-name>
```

生成当前 change 的完整规格文档：

| 文件 | 作用 |
| --- | --- |
| `proposal.md` | 说明为什么要做、目标、影响范围、非目标 |
| `clarification.md` | 记录澄清问题、回答、假设和风险 |
| `requirements.md` | 定义最终需求、验收标准、业务规则和边界条件 |
| `design.md` | 描述技术方案、架构影响和关键决策 |
| `tasks.md` | 拆分具体实现任务 |
| `test-case.md` | 定义测试用例、覆盖关系、预期结果和执行映射 |
| `test-case.json` | 测试用例的机器可读结构 |
| `traceability.json` | 记录 REQ -> TASK -> TC 的追踪关系 |

### 6.3.1 文档职责边界

```text
proposal.md       = 为什么做
clarification.md  = 怎么澄清出来的
requirements.md   = 最终要满足什么
design.md         = 怎么设计
tasks.md          = 怎么实现
test-case.md      = 怎么验证
traceability.json = 如何证明它们互相关联
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

## Open Questions
```

---

### 7.2 clarification.md

`clarification.md` 记录需求澄清过程。

建议结构：

```markdown
# Clarification

## Summary

## Questions and Answers

### Q1

Question:
Answer:
Decision:
Risk Level:

## Assumptions

## Open Questions

## Skipped Clarification

## Risks
```

---

### 7.3 requirements.md

`requirements.md` 是最终需求文档，也是后续任务、测试和验证的核心来源。

建议结构：

```markdown
# Requirements

## Overview

## Requirements

### REQ-001: 用户可以通过邮箱和密码登录

Priority: P0
Source: clarification.md#Q1
Status: approved

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

要求：

- 每条需求必须有唯一 ID。
- 每条需求必须有优先级。
- 每条 P0/P1 需求必须有验收标准。
- 每条需求必须可追踪到 TASK 和 TC。
- 需求本身不做 Level 0-3 问题分级。
- 如果需求缺少必要字段、不可测试或不可追踪，应通过文档评分扣分处理，而不是生成 Level 0-3 问题。

---

### 7.4 design.md

`design.md` 描述技术方案。

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

要求：

- 说明关键技术决策。
- 说明对现有架构的影响。
- 说明兼容性与迁移风险。
- 对复杂变更应记录 rejected alternatives。

---

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

Steps:
- [ ] ...
- [ ] ...

Evidence:
- src/...
- tests/...
```

要求：

- 每个 TASK 必须绑定至少一个 REQ。
- 每个 TASK 必须绑定至少一个 TC。
- 每个 TASK 应有可执行步骤。
- apply 阶段按 tasks.md 执行。
- 完成后应更新状态和证据。

---

### 7.6 test-case.md

`test-case.md` 是测试规格，不是测试代码。

它属于第 6.3 生成文档阶段的产物。

它回答：

- 要测什么？
- 为什么测？
- 覆盖哪条需求？
- 对应哪个任务？
- 预期结果是什么？
- 将来如何执行？

建议结构：

```markdown
# Test Cases

## TC-001 用户可以成功登录

Requirement:
- REQ-001

Task:
- TASK-001
- TASK-002

Type:
- integration

Priority:
- P0

Preconditions:
- 用户已注册
- 用户账号状态正常

Steps:
1. 输入正确邮箱和密码
2. 点击登录按钮

Expected Result:
- 登录成功
- 返回 session
- 页面跳转到首页

Execution Mapping:
- automated: true
- commandId: test:login
- testFile: tests/login.test.ts
- status: pending
```

要求：

- 每个 TC 必须绑定至少一个 REQ。
- 每个 TC 必须绑定至少一个 TASK。
- 每个 TC 必须有 expected result。
- 自动化 TC 必须声明测试文件路径。
- 自动化 TC 必须声明 commandId。
- P0/P1 测试建议必须自动化。
- P2/P3 可以允许人工验证，但必须提供验证步骤和证据。

---

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
      "tasks": ["TASK-001", "TASK-002"],
      "type": "integration",
      "priority": "P0",
      "automated": true,
      "commands": ["test:login"],
      "files": ["tests/login.test.ts"],
      "status": "pending"
    }
  ]
}
```

---

### 7.8 traceability.json

`traceability.json` 记录需求、任务、测试用例之间的关系。

示例：

```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "tasks": ["TASK-001", "TASK-002"],
      "tests": ["TC-001", "TC-002"],
      "status": "pending"
    }
  ]
}
```

要求：

- 每个 REQ 至少绑定一个 TASK。
- 每个 REQ 至少绑定一个 TC。
- 每个 TASK 至少绑定一个 TC。
- 缺失核心绑定关系时标记为 Level 3。

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

myspec 对每个文档进行多角色、多维度评分。

角色划分参考 gstack 的 review 视角：优先从产品价值、设计质量、工程可行性和 QA 覆盖四个主角色审视；安全与开发体验作为专项角色按需补充。

评分规则：

- 总分为 100。
- 每个维度不得低于 80。
- Level 3 问题一票否决。
- 评分结果输出 JSON。
- 评分不通过时，不允许 apply。

### 8.2 角色

建议角色参考 gstack：

- CEO Reviewer
- Design Reviewer
- Engineering Reviewer
- QA Reviewer
- Security Reviewer（涉及认证、权限、数据边界、外部输入时启用）
- DevEx Reviewer（涉及 CLI、脚手架、配置或开发流程体验时启用）

角色使用建议：

- `proposal.md`、`requirements.md` 默认启用 CEO Reviewer、Engineering Reviewer、QA Reviewer。
- `design.md` 默认启用 Design Reviewer、Engineering Reviewer；涉及交互体验时补充 CEO Reviewer。
- `tasks.md`、`test-case.md` 默认启用 Engineering Reviewer、QA Reviewer。
- Security Reviewer 和 DevEx Reviewer 不是所有文档的必选角色，但一旦变更触及对应风险面，应参与评分。

### 8.3 文档评分维度

| 文档 | 评分维度 |
| --- | --- |
| `proposal.md` | 目标清晰度、价值、范围边界、影响面、风险 |
| `clarification.md` | 问题覆盖度、回答明确度、假设记录、风险暴露 |
| `requirements.md` | 完整性、可验证性、优先级、验收标准、边界条件 |
| `design.md` | 架构一致性、复杂度、可维护性、安全性、兼容性 |
| `tasks.md` | 可执行性、拆分粒度、依赖顺序、可追踪性 |
| `test-case.md` | 覆盖率、边界场景、异常场景、执行映射、可追踪性 |

### 8.4 评分结果示例

```json
{
  "document": "requirements.md",
  "overall": 88,
  "pass": true,
  "dimensions": {
    "clarity": 90,
    "testability": 86,
    "completeness": 88,
    "edgeCases": 84,
    "traceability": 92
  },
  "issues": []
}
```

---

## 9. 检查问题分级

myspec 的 Level 0-3 分级只用于**检查后发现的问题**。

需求、澄清问题和规格文档本身不使用 Level 0-3 分级：

- `requirements.md` 只记录最终需求、验收标准、业务规则和边界条件。
- `clarification.md` 只记录澄清问题、回答、假设、未确认项和风险。
- 文档质量通过多维度评分判断，每个维度不得低于 80 分。

Level 0-3 仅出现在以下检查结果中：

- 代码审查结果。
- 测试执行与测试质量检查结果。
- 代码鲁棒性检查结果。
- 安全性检查结果。
- 最终验证报告。

| 等级 | 含义 | 是否阻塞 |
| --- | --- | --- |
| Level 0 | 优化建议，不影响正确性 | 否 |
| Level 1 | 轻微问题，不影响核心功能 | 否 |
| Level 2 | 明显风险，需要修复或在报告中说明 | 默认不阻塞，可配置 |
| Level 3 | 阻塞问题，影响核心需求、测试可信度、安全性或数据正确性 | 是 |

Level 3 示例：

- P0/P1 测试失败。
- 核心需求没有对应测试执行结果。
- 测试文件不存在。
- 测试命令无法运行。
- 实现代码未覆盖核心验收标准。
- 权限校验缺失。
- 输入校验缺失导致崩溃或数据错误。
- 硬编码密钥、token、密码。
- 敏感信息泄露到日志。
- 引入破坏性兼容问题，且没有说明和验证。

分级结果应写入：

- `verification.json`
- `review-result.json`，如果存在代码审查阶段
- `report.json`

不应写入 `requirements.md` 作为需求属性。

---

## 10. 应用变更

### 10.1 apply 阶段定位

```bash
myspec apply <change-name>
```

或：

```text
/myspec:apply <change-name>
```

`apply` 阶段类似 OpenSpec 的 `/opsx:apply`。

它不是简单生成 Agent Prompt，而是由当前 AI coding assistant 根据已确认的规格文档执行实现。

职责：

- 读取 `proposal.md`
- 读取 `clarification.md`
- 读取 `requirements.md`
- 读取 `design.md`
- 读取 `tasks.md`
- 读取 `test-case.md`
- 读取 `test-case.json`
- 读取 `traceability.json`
- 按 `tasks.md` 实现功能代码
- 按 `test-case.md` / `test-case.json` 实现测试代码
- 更新任务状态和测试证据
- 遇到代码审查、测试验证或鲁棒性检查中的 Level 3 问题时停止；发现需求冲突或设计无法实现时回退到文档修订阶段

### 10.2 apply 进入条件

进入 apply 的条件：

- `proposal.md` 存在。
- `clarification.md` 存在，或已明确跳过并记录风险。
- `requirements.md` 存在。
- `design.md` 存在。
- `tasks.md` 存在。
- `test-case.md` / `test-case.json` 存在。
- `traceability.json` 存在。
- 所有文档评分维度 >= 80。
- 文档评分达标。
- 每个 REQ 至少绑定一个 TASK。
- 每个 REQ 至少绑定一个 TC。

### 10.3 apply 执行要求

- 严格按 `tasks.md` 执行。
- 同时实现功能代码和测试代码。
- 不得跳过 P0/P1 测试。
- 不得修改无关范围。
- 发现需求冲突时停止。
- 发现 design 不可实现时回退到 design/review 阶段。
- 完成后更新任务状态和 evidence。

---

## 11. 执行与验证

```bash
myspec verify <change-name>
```

或：

```text
/myspec:verify <change-name>
```

该阶段用于确认当前 change 是否真正满足需求，并检查实现结果是否具备基本质量和鲁棒性。

验证不只包括测试是否通过，还应覆盖：

- 需求追踪
- 测试执行
- 代码基础质量
- 异常处理
- 边界条件
- 安全风险
- 鲁棒性

### 11.1 需求追踪检查

- 检查 `REQ -> TASK -> TC` 是否完整。
- 每个 `REQ` 必须至少绑定一个 `TASK`。
- 每个 `REQ` 必须至少绑定一个 `TC`。
- 每个 `TASK` 必须至少绑定一个 `TC`。
- 缺失核心追踪关系时，标记为 Level 3。

### 11.2 测试执行检查

- 检查 `test-case.json` 中的执行映射是否完整。
- 检查测试文件是否存在。
- 检查测试命令 ID 是否存在于 `config.yaml`。
- 执行测试命令。
- 记录 `checks.json`。
- P0/P1 测试失败时，标记为 Level 3。

### 11.3 代码基础质量检查

执行项目配置的基础质量命令，例如：

- typecheck
- lint
- format check
- build
- unit test
- integration test
- e2e test
- dependency audit

命令由 `config.yaml` 配置，myspec 不绑定具体语言或框架。

检查项包括：

- 是否存在明显死代码。
- 是否存在未使用变量。
- 是否存在未处理 Promise。
- 是否存在未捕获异常。
- 是否存在格式化失败。
- 是否构建失败。
- 是否类型检查失败。

### 11.4 代码鲁棒性检查

代码鲁棒性检查用于发现“测试通过但实现不稳健”的问题。

检查项包括：

- 输入校验是否充分。
- 空值、非法值、超大值是否被处理。
- 重复请求是否被处理。
- 并发场景是否被考虑。
- 幂等性是否被考虑。
- 异常路径是否有明确处理。
- 失败时是否有合理降级、回滚或错误提示。
- 错误信息是否明确且不泄露敏感信息。
- 新增代码是否破坏已有兼容性。
- 是否存在未覆盖的核心边界测试。
- 是否存在只覆盖 happy path 的测试。
- 是否存在测试只验证 mock、不验证真实行为的问题。
- 是否存在资源泄漏风险。
- 是否存在超时、重试、取消等场景缺失。

鲁棒性问题按 Level 0-3 分级。

Level 3 示例：

- 核心输入未校验，可能导致崩溃或错误数据。
- 核心异常路径未处理，导致主流程不可用。
- 权限检查缺失。
- 数据写入缺少幂等性，可能导致重复写入。
- P0/P1 测试没有覆盖异常路径。
- 测试通过但需求边界条件没有任何验证。
- 新增代码破坏向后兼容，且未说明。
- 引入硬编码密钥或敏感日志。

### 11.5 安全性检查

安全性检查属于鲁棒性检查的一部分，但单独记录。

检查项包括：

- 是否引入硬编码密钥、token、密码。
- 是否存在注入风险。
- 是否遗漏权限校验。
- 是否泄露敏感日志。
- 是否存在不安全的默认配置。
- 是否存在依赖安全风险。
- 是否存在不安全的错误信息。
- 是否存在未校验的外部输入。

### 11.6 验证结果输出

验证阶段输出：

- `checks.json`：记录命令执行结果。
- `verification.json`：记录需求追踪、测试执行、代码质量、鲁棒性和安全性检查结果。
- `robustness.json`：记录鲁棒性问题详情。
- `evidence.json`：记录需求、任务、测试、文件证据。
- `report.md` / `report.json`：在报告阶段汇总验证结论。

### 11.7 verification.json 示例

```json
{
  "change": "add-login",
  "status": "failed",
  "gates": {
    "traceability": "passed",
    "testExecution": "passed",
    "codeQuality": "passed",
    "robustness": "failed",
    "security": "warning"
  },
  "robustness": {
    "status": "failed",
    "issues": [
      {
        "level": 3,
        "category": "input-validation",
        "title": "REQ-002 缺少非法输入处理",
        "description": "登录接口未覆盖空邮箱、非法邮箱格式、超长密码等输入场景。",
        "relatedRequirements": ["REQ-002"],
        "relatedTestCases": ["TC-004", "TC-005"],
        "suggestion": "补充输入校验逻辑，并增加对应边界测试。"
      }
    ]
  },
  "checks": {
    "typecheck": "passed",
    "lint": "passed",
    "test": "passed",
    "build": "passed"
  }
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
  allow_skip_clarification: true
  require_human_approval: false

score:
  scale: 100
  dimension_min: 80
  blocking_issue_level: 3

requirements:
  require_task_link: true
  require_test_link: true

checks:
  commands:
    - id: typecheck
      name: Type check
      command: npm run typecheck
      required: false

    - id: lint
      name: Lint
      command: npm run lint
      required: false

    - id: test
      name: Run tests
      command: npm test
      required: true

    - id: build
      name: Build
      command: npm run build
      required: false

    - id: security:audit
      name: Dependency audit
      command: npm audit
      required: false

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
  collect_file_evidence: true
  allow_untracked_file_changes: false

robustness:
  enabled: true
  blocking_issue_level: 3
  categories:
    - input-validation
    - error-handling
    - boundary-cases
    - concurrency
    - idempotency
    - compatibility
    - security
    - observability

agents:
  default: claude
  supported:
    - claude
    - cursor
    - codex
```

### 12.2 非 JS/TS 项目配置示例

Python：

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

Go：

```yaml
checks:
  commands:
    - id: test
      command: go test ./...
      required: true
```

Rust：

```yaml
checks:
  commands:
    - id: test
      command: cargo test
      required: true
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

### 13.2 Slash Commands

```text
/myspec:propose
/myspec:clarify
/myspec:draft
/myspec:review
/myspec:apply
/myspec:verify
/myspec:report
/myspec:archive
```

可选短命名：

```text
/msx:propose
/msx:clarify
/msx:draft
/msx:review
/msx:apply
/msx:verify
/msx:report
/msx:archive
```

---

## 14. 状态机

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
rejected
```

### 14.1 状态流转

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

### 14.2 Gate 规则

| 流转 | 条件 |
| --- | --- |
| proposed -> clarifying | proposal.md 存在 |
| clarifying -> drafted | clarification 完成，或允许跳过并记录风险 |
| drafted -> reviewing | 所有必需文档存在 |
| reviewing -> approved | 所有文档评分维度 >= 80 |
| approved -> applying | traceability 完整，文档评分通过 |
| applying -> implemented | tasks 状态完成，测试代码证据存在 |
| implemented -> verifying | 实现证据和测试证据存在 |
| verifying -> verified | 测试通过，代码审查/鲁棒性/安全检查无 Level 3 |
| verified -> reported | verification.json 存在 |
| reported -> archived | report.md / report.json 存在 |

---

## 15. 报告

### 15.1 report.md

报告面向人类阅读。

内容包括：

- 变更摘要
- 最终需求列表
- 实现摘要
- 测试摘要
- 文档评分结果
- 验证结果
- 鲁棒性检查结果
- 安全检查结果
- 风险和遗留问题
- 关键设计决策
- 修改文件证据
- 后续建议

### 15.2 report.json

报告面向机器处理。

内容包括：

```json
{
  "change": "add-login",
  "status": "verified",
  "requirements": [],
  "tasks": [],
  "tests": [],
  "scores": {},
  "verification": {},
  "robustness": {},
  "risks": [],
  "artifacts": []
}
```

---

## 16. 归档

```bash
myspec archive <change-name>
```

或：

```text
/myspec:archive <change-name>
```

第一版不集成 Git。

归档行为：

- 检查 report 是否存在。
- 检查 verification 是否通过。
- 检查是否存在代码审查、测试验证、鲁棒性检查中的未处理 Level 3。
- 移动 change 到 `.myspec/archive/`。
- 保留 Markdown 和 JSON 产物。
- 保留评分、验证、鲁棒性和报告历史。

归档目录示例：

```text
.myspec/archive/
  2026-06-07-add-login/
    proposal.md
    clarification.md
    requirements.md
    design.md
    tasks.md
    test-case.md
    test-case.json
    traceability.json
    scores/
    verification/
    report.md
    report.json
```

---

## 17. MVP 范围

### 17.1 第一版包含

- `myspec init`
- `myspec propose`
- `myspec clarify`
- `myspec draft`
- `myspec review`
- `myspec apply`
- `myspec verify`
- `myspec report`
- `myspec archive`
- 通用项目支持
- `requirements.md`
- `test-case.md` / `test-case.json`
- `traceability.json`
- 多维度评分
- 代码审查与验证问题分级
- 测试执行映射
- `checks.json`
- `verification.json`
- 代码鲁棒性检查
- `report.md` / `report.json`

### 17.2 第一版不包含

- Git 集成
- 自动创建分支
- 自动提交 commit
- 自动创建 PR
- 多人协作权限
- 云端服务
- 深度静态分析引擎
- 默认强制 mutation testing
- 默认强制 fuzz testing
- 自研 autonomous agent

---

## 18. 后续扩展

后续可以考虑：

- Git 集成
- PR 报告生成
- CI 集成
- Web UI
- 多项目模板
- 更强的 diff 分析
- AST 级代码分析
- mutation testing
- property-based testing
- fuzz testing
- 安全扫描插件
- 多 agent 协作
- 评分历史趋势分析
- 团队审批流

---

## 19. 关键结论

myspec 的最终设计应围绕以下核心原则展开：

1. **通用项目支持**  
   不限制语言、框架或项目结构。

2. **规格先于实现**  
   先生成 proposal、clarification、requirements、design、tasks、test cases，再进入 apply。

3. **apply 是执行实现，不只是生成 prompt**  
   类似 OpenSpec 的 `/opsx:apply`，由 AI coding assistant 执行功能代码和测试代码实现。

4. **test-case.md 是测试规格，不是测试代码**  
   测试代码在 apply 阶段实现，测试在 verify 阶段执行。

5. **requirements.md 是必要产物**  
   它保存最终需求，是 traceability 和 verification 的核心来源。

6. **每条需求必须可追踪**  
   每个 REQ 必须绑定 TASK 和 TC。

7. **测试用例必须可执行检查**  
   自动化测试必须有 commandId 和测试文件路径。

8. **验证不只跑测试**  
   verify 阶段还要检查代码质量、边界条件、异常路径、安全性和鲁棒性。

9. **检查问题 Level 3 一票否决**  
   阻塞问题必须阻止进入下一阶段。

10. **报告必须同时给人和机器使用**  
    输出 `report.md` 和 `report.json`。

---

## 20. 参考资料

- OpenSpec GitHub Repository: https://github.com/Fission-AI/OpenSpec
- OpenSpec Getting Started: https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md
- OpenSpec Commands: https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md
- OpenSpec OPSX Workflow: https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md
- OpenSpec Supported Tools: https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md
- OWASP SAMM: https://owasp.org/www-project-samm/
- OWASP SAMM Defect Management: https://owaspsamm.org/model/implementation/defect-management/
- OWASP SAMM Security Testing: https://owaspsamm.org/model/verification/security-testing/
- OWASP Risk Rating Methodology: https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
