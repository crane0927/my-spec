import { join } from "node:path";
import { writeTextFile } from "../core/fs.js";

export async function runClarify(cwd: string, changeName: string, skip: boolean): Promise<void> {
  const clarificationPath = join(cwd, ".myspec", "changes", changeName, "clarification.md");

  const content = skip
    ? `# Clarification

## Summary

Skipped clarification for low-risk change.

## Skipped Clarification

- skipped: true
- reason: user skipped clarification

## Assumptions

- none yet

## Open Questions

- none yet

## Risks

- clarification skipped
`
    : `# Clarification

## Summary
`;

  await writeTextFile(clarificationPath, content);
}
