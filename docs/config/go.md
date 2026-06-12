# Go 项目 checks 配置

Go 项目通常可以把测试和静态检查直接映射到 `checks.commands`。

## 推荐起步配置

```yaml
checks:
  commands:
    - id: test
      command: go test ./...
      required: true
    - id: vet
      command: go vet ./...
      required: false
```

## 说明

- `go test ./...` 用于执行整个模块树下的测试。
- `go vet ./...` 可作为轻量的代码问题扫描。

如果你的项目有额外约束，也可以继续补充 `golangci-lint run` 等命令。
