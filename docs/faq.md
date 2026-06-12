# FAQ

## `status` 一直提示 `myspec review <change>` 怎么办？

先检查 `.myspec/changes/<change>/scores/review-summary.json` 是否已经生成。没有这个文件时，`status` 会继续提示先执行 `review`。如果文件存在但仍未前进，再检查 `review-summary.json` 里的 `pass` 是否为 `true`。

## `verify` 失败时应该看哪里？

优先查看：

- `.myspec/changes/<change>/verification/verification.json`
- `.myspec/changes/<change>/verification/evidence.json`

`verification.json` 用来判断哪一类 gate 失败，`evidence.json` 用来回看执行证据。

## `lite` 模式适合什么时候用？

适合单模块、小范围、低风险改动，例如文案修复、局部 UI 微调、边界清晰的缺陷修复。只要变更已经涉及跨模块协作、认证权限、兼容性或架构调整，就更适合回到 `standard`。

## 如何把自己的语言命令接入 `checks.commands`？

直接编辑 `.myspec/config.yaml`：

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

把 `command` 换成你当前技术栈的真实命令即可，例如 `go test ./...`、`cargo test`、`npm test`。
