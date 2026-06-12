# Changelog

## 0.1.0

### 初始能力

- 提供 `init / propose / clarify / draft / review / apply / verify / report / status / list` 主链命令。
- 支持 `standard` 与 `lite` 两种流程模式。
- 支持基于 review-summary、verification、report 产物的状态流转。
- 支持通过 `checks.commands` 接入项目自定义验证命令。

### 当前限制

- 终端输出与模板能力仍以本地 CLI 场景为主，尚未提供交互式向导。
- 发布准备已具备基础元信息和检查脚本，但未接入自动化发版流程。
- 跨语言配置与示例文档已提供参考骨架，仍需使用者按项目实际命令调整。
