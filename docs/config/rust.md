# Rust 项目 checks 配置

Rust 项目可以把测试与质量检查统一接入 `verify` 阶段。

## 推荐起步配置

```yaml
checks:
  commands:
    - id: test
      command: cargo test
      required: true
    - id: lint
      command: cargo clippy -- -D warnings
      required: false
```

## 说明

- `cargo test` 是默认的核心验证命令。
- `cargo clippy -- -D warnings` 可以把 lint warning 提升为失败信号。

如果项目构建成本较高，也可以按需加入 `cargo check` 作为更快的前置检查。
