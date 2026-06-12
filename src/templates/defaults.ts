export const defaultConfig = `project:
  name: my-project
  type: generic

workflow:
  allow_skip_clarification: true

checks:
  commands:
    - id: test
      command: npm test
      required: true
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
