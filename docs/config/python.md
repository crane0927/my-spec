# Python 项目 checks 配置

`my-spec` 不限制技术栈。对于 Python 项目，可以把 `verify` 阶段的检查命令接到 `.myspec/config.yaml` 的 `checks.commands` 下。

## 推荐起步配置

```yaml
checks:
  commands:
    - id: test
      command: pytest
      required: true
    - id: lint
      command: ruff check .
      required: false
    - id: typecheck
      command: mypy .
      required: false
```

## 说明

- `pytest` 适合承接单元测试和集成测试。
- `ruff check .` 适合做快速 lint。
- `mypy .` 适合作为可选的静态类型检查。

如果你的项目还没有 `mypy`，可以先只保留 `pytest` 和 `ruff check .`。
