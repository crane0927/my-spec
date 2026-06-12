export const defaultConfig = `# myspec 项目基础信息
project:
  name: my-project
  type: generic

# 工作流策略
workflow:
  # 为 true 时，standard 模式也允许先用占位 clarification 继续推进
  allow_skip_clarification: true

# 项目级验证命令；verify 阶段会按这里的顺序执行
checks:
  commands:
    - id: test
      # 按你的技术栈替换，例如 pytest、go test ./...、cargo test
      command: npm test
      required: true
    - id: build
      # 可选示例：把构建或静态检查接进 verify
      command: npm run build
      required: false
`;

export const templateFiles: Record<string, string> = {
  "templates/proposal.md": "# Proposal\n",
  "templates/clarification.md": "# Clarification\n",
  "templates/requirements.md": "# Requirements\n",
  "templates/design.md": "# Design\n",
  "templates/tasks.md": "# Tasks\n",
  "templates/test-case.md": "# Test Cases\n",
  "templates/report.md": "# Report\n",
};
