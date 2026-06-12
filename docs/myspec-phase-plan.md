# myspec 阶段性任务拆分

> 基于文档：[myspec-design.md](./myspec-design.md)
> 目标：将 `myspec v2.2` 设计方案拆分为可逐阶段推进的实施任务
> 默认策略：优先打通 MVP 主链路，再补齐评分协议、证据模型和回退能力

---

## 1. 拆分原则

本次阶段拆分遵循以下原则：

- 先做主链路闭环，再做高级能力增强。
- 每个阶段都应产出可验证结果，而不是只完成抽象设计。
- 优先实现 `standard` 主流程，`lite` 作为同构裁剪能力在后续补齐。
- 文档、CLI、验证和报告需要同步推进，避免只做命令壳子。
- 每个阶段都应定义明确的完成标准，避免“功能看起来差不多”。

---

## 2. 总体阶段划分

建议将 `myspec` 拆为 6 个阶段推进：

1. Phase 0：项目骨架与基础约定
2. Phase 1：change 生命周期与文档骨架
3. Phase 2：review 与追踪主链路
4. Phase 3：apply / verify / report 主闭环
5. Phase 4：v2.2 增强能力补齐
6. Phase 5：体验收尾与发布准备

其中：

- Phase 0-3 构成 MVP 主线
- Phase 4 对应 `v2.2` 中最关键的增强项
- Phase 5 用于提升实际可用性和可维护性

---

## 3. Phase 0：项目骨架与基础约定

### 3.1 阶段目标

建立 `myspec` 的最小可开发骨架，让后续功能有稳定的目录、配置和命令入口。

### 3.2 主要交付物

- CLI 项目初始化结构
- 基础 `config.yaml` schema
- 命令入口骨架
- `.myspec/` 目录初始化能力
- 基础开发、测试、lint 命令

### 3.3 核心任务

#### 任务 0.1：初始化 Node.js + TypeScript CLI 工程

- 建立 `src/`、`tests/`、`docs/`、`scripts/` 基础目录
- 配置 TypeScript、测试框架、lint 和构建命令
- 统一 CLI 启动入口和命令注册方式

#### 任务 0.2：定义配置与目录约定

- 定义 `.myspec/config.yaml` 的基础 schema
- 定义 `.myspec/templates/`、`.myspec/rubrics/`、`.myspec/agents/` 目录职责
- 定义 `changes/<change-name>/` 的标准目录结构

#### 任务 0.3：实现 `myspec init`

- 创建 `.myspec/` 基础目录
- 写入默认 `config.yaml`
- 写入默认模板和占位说明
- 校验重复初始化和已有目录场景

#### 任务 0.4：建立通用基础设施

- 文件读写封装
- YAML / JSON 解析与校验
- 统一错误结构
- 统一终端输出格式

### 3.4 验收标准

- 能执行 `myspec init`
- 初始化后生成符合设计文档的基础目录
- 项目具备可运行的测试、lint、构建命令
- 基础配置读写与 schema 校验可用

---

## 4. Phase 1：change 生命周期与文档骨架

### 4.1 阶段目标

打通从创建 change 到生成核心文档骨架的流程，让用户可以创建、查看和管理一个 change。

### 4.2 主要交付物

- `myspec propose`
- `myspec clarify`
- `myspec draft`
- `myspec status`
- `myspec list`
- `meta.json` 与文档模板生成能力

### 4.3 核心任务

#### 任务 1.1：实现 change 创建能力

- 生成 `changes/<change-name>/`
- 创建 `meta.json`
- 支持 `mode`、`status`、`riskLevel` 等基础字段
- 处理重复 change 名称与非法命名

#### 任务 1.2：实现 `proposal.md` 初始化

- 生成 `proposal.md` 模板
- 在模板中体现 `Recommended Workflow Mode`
- 支持 `standard` / `lite` 的初始差异化提示

#### 任务 1.3：实现 `clarify` 阶段骨架

- 生成 `clarification.md`
- 支持 `--skip`
- 跳过时生成最小占位文档，而不是缺文件

#### 任务 1.4：实现 `draft` 阶段文档批量生成

- 生成 `requirements.md`
- 生成 `design.md`
- 生成 `tasks.md`
- 生成 `test-case.md`
- 生成 `test-case.json`
- 生成 `traceability.json`

#### 任务 1.5：实现 change 查询能力

- `status` 输出当前阶段、缺失文档、建议下一步
- `list` 输出 change 列表和基本元信息

### 4.4 验收标准

- 能创建一个完整的 change 目录
- `clarify --skip` 会生成占位文档
- `draft` 后可得到一套结构完整的文档骨架
- `status` 能指出当前 change 缺失什么、下一步做什么

---

## 5. Phase 2：review 与追踪主链路

### 5.1 阶段目标

实现文档评分、追踪关系检查和 review gate，让 `apply` 前的质量门禁真正生效。

### 5.2 主要交付物

- `myspec review`
- 文档评分结果文件
- `review-summary.json`
- `traceability.json` 校验能力
- 基础 issue 分级输出

### 5.3 核心任务

#### 任务 2.1：实现文档完整性校验

- 检查当前模式所需文档是否存在
- 检查必填章节和关键字段
- 对缺失字段输出结构化错误

#### 任务 2.2：实现评分协议 v1

- 定义 reviewer 输入输出 schema
- 支持文档维度分、总分、issue 列表
- 支持维度阈值和 Level 3 阻塞

#### 任务 2.3：实现多 reviewer 结果汇总

- 汇总 `proposal`、`requirements`、`design`、`tasks`、`test-case` 评分结果
- 生成 `review-summary.json`
- 输出最终 pass / fail 和阻塞原因

#### 任务 2.4：实现追踪关系校验

- 检查 REQ 是否绑定 TASK
- 检查 REQ 是否绑定 TC
- 检查 TASK 是否绑定 TC
- 输出缺口摘要和 orphan 项

#### 任务 2.5：实现 review gate

- review 不通过时阻止进入 `apply`
- 输出建议回退目标阶段
- 在 `status` 中展示 review 结果

### 5.4 验收标准

- `review` 能产生稳定的 JSON 结果
- 能识别文档缺失、字段缺失、追踪缺失
- 任一关键维度低于阈值时会阻塞
- `review-summary.json` 能解释为什么通过或失败

---

## 6. Phase 3：apply / verify / report 主闭环

### 6.1 阶段目标

实现 MVP 最核心的执行闭环，让 `myspec` 从“生成文档”进化到“驱动实现与验证”。

### 6.2 主要交付物

- `myspec apply`
- `myspec verify`
- `myspec report`
- `checks.json`
- `verification.json`
- `evidence.json`
- `report.md` / `report.json`

### 6.3 核心任务

#### 任务 3.1：实现 apply 输入装配

- 读取 proposal / clarification / requirements / design / tasks / test-case / traceability
- 组合成统一 apply 上下文
- 校验 apply 进入条件

#### 任务 3.2：实现 apply 阶段状态更新

- 更新 change 状态
- 更新 `tasks.md` 中任务状态
- 更新测试执行状态
- 为后续证据记录预留结构

#### 任务 3.3：实现 checks 执行引擎

- 读取 `config.yaml` 中的命令配置
- 执行 typecheck / test / build 等命令
- 捕获 stdout / stderr / exit code
- 生成 `checks.json`

#### 任务 3.4：实现 verify 主检查流程

- 校验需求追踪
- 校验测试执行映射
- 汇总代码质量命令结果
- 汇总鲁棒性和安全性检查结论

#### 任务 3.5：实现 evidence 记录能力 v1

- 记录命令执行证据
- 记录测试文件和测试结果证据
- 记录与 REQ / TASK / TC 的关联关系

#### 任务 3.6：实现报告生成

- 生成人类可读 `report.md`
- 生成机器可读 `report.json`
- 输出验证结果、风险、遗留问题和文件证据

### 6.4 验收标准

- `apply` 能正确读取并校验规格文档
- `verify` 能执行配置命令并输出结构化结果
- `report` 能汇总 review、验证和证据结果
- 主闭环可完成一次从文档到验证再到报告的演练

---

## 7. Phase 4：v2.2 增强能力补齐

### 7.1 阶段目标

补齐 `v2.2` 真正新增的关键能力，让文档中的增强设计落到实现层，而不只停留在描述层。

### 7.2 主要交付物

- `standard` / `lite` 双模式支持
- 显式回退流转
- 覆盖缺口摘要
- 证据完整性检查
- 更完整的 review / verify issue schema

### 7.3 核心任务

#### 任务 4.1：实现 `standard` / `lite` 模式分流

- 按模式约束所需文档
- 按模式调整 `draft`、`review`、`status` 行为
- 在 `meta.json`、报告和状态中反映当前模式

#### 任务 4.2：实现回退状态机

- 支持 `reviewing -> drafted`
- 支持 `applying -> drafted`
- 支持 `verifying -> applying`
- 输出回退原因和建议动作

#### 任务 4.3：增强 traceability 与 coverage summary

- 输出 fully covered / partially covered / uncovered
- 输出 gaps 列表
- 在 `report` 中展示覆盖摘要

#### 任务 4.4：增强 evidence schema

- 增加 `manual-check`
- 增加 `risk-acceptance`
- 增加证据完整性校验

#### 任务 4.5：增强 verify 的鲁棒性与安全检查承载能力

- 统一 issue schema
- 支持 category、source、recommendedAction
- 支持证据不足时单独标记 gate

### 7.4 验收标准

- 同一个 change 能以 `standard` 或 `lite` 模式运行
- 失败时系统能明确指出回退到哪个阶段
- 报告中能看到 coverage summary 和 evidence summary
- `verify` 可以区分“功能失败”和“证据不足”

---

## 8. Phase 5：体验收尾与发布准备

### 8.1 阶段目标

提升 `myspec` 的日常可用性、可维护性和对外可交付性。

### 8.2 主要交付物

- 更完善的错误提示和终端输出
- 使用文档与示例 change
- 非 JS/TS 项目配置示例
- 发布与版本管理准备

### 8.3 核心任务

#### 任务 5.1：打磨终端交互体验

- 优化命令输出可读性
- 区分 warning / blocking / next action
- 补齐常见错误文案

#### 任务 5.2：补齐示例与文档

- 提供一个标准 change 示例
- 提供一个 lite change 示例
- 补齐配置说明和常见问题

#### 任务 5.3：补齐跨技术栈示例

- Python 示例
- Go 示例
- Rust 示例

#### 任务 5.4：补齐发布准备

- 版本号策略
- 变更日志流程
- 打包和发布命令

### 8.4 验收标准

- 新用户可以按文档完成一次端到端演练
- 不同技术栈用户能看懂如何配置 checks
- 项目具备基础发布条件

---

## 9. 推荐执行顺序

建议按以下顺序推进：

1. 先完成 Phase 0，建立可持续开发基础
2. 再完成 Phase 1，确保文档流转跑通
3. 接着完成 Phase 2，让质量门禁具备阻塞能力
4. 然后完成 Phase 3，形成 MVP 主闭环
5. MVP 可用后，再推进 Phase 4 的 `v2.2` 增强能力
6. 最后完成 Phase 5，提升体验与可发布性

如果资源有限，建议把 MVP 边界控制在：

- `init`
- `propose`
- `draft`
- `review`
- `apply`
- `verify`
- `report`

不必在第一阶段同时追求：

- 完整高级评分协议
- 复杂安全扫描
- 多技术栈深度适配
- 高级发布自动化

---

## 10. 建议的里程碑定义

### Milestone A：文档主链路可跑

完成 Phase 0 + Phase 1 后，应达到：

- 能初始化项目
- 能创建 change
- 能生成完整文档骨架
- 能查询当前状态

### Milestone B：质量门禁可阻塞

完成 Phase 2 后，应达到：

- review 有稳定 JSON 输出
- traceability 缺失会被识别
- apply 前能真正阻塞不合格 change

### Milestone C：MVP 闭环可演示

完成 Phase 3 后，应达到：

- 能完成一次从文档到验证再到报告的真实演练
- 能输出 checks、verification、evidence、report

### Milestone D：v2.2 增强能力落地

完成 Phase 4 后，应达到：

- 支持 `standard` / `lite`
- 支持失败回退
- 支持 coverage / evidence 摘要

### Milestone E：可对外试用

完成 Phase 5 后，应达到：

- 文档完整
- 示例完整
- 基础发布能力具备

---

## 11. 风险提示

当前最容易失控的不是编码量，而是范围：

- 如果在 Phase 0-2 就试图一次性做完高级评分协议，进度会明显变慢。
- 如果在 Phase 3 前就追求很强的多语言通用性，主链路会被拖散。
- 如果没有先定义 evidence 和 issue schema，后面 `verify` 与 `report` 很容易返工。

因此建议始终坚持：

- 先闭环
- 再增强
- 最后打磨

---

## 12. 下一步建议

如果继续往下推进，最合适的下一步是把 Phase 0 和 Phase 1 进一步展开成“可直接实施的任务清单”，包括：

- 具体命令
- 目录与文件路径
- 每个任务的依赖关系
- 每个任务的验证方式

这一步完成后，就可以直接进入开发执行。
