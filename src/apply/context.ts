import { readChangeFile } from "../core/change.js";

export async function loadApplyContext(root: string, changeName: string) {
  return {
    proposal: await readChangeFile(root, changeName, "proposal.md"),
    clarification: await readChangeFile(root, changeName, "clarification.md"),
    requirements: await readChangeFile(root, changeName, "requirements.md"),
    design: await readChangeFile(root, changeName, "design.md"),
    tasks: await readChangeFile(root, changeName, "tasks.md"),
    testCase: await readChangeFile(root, changeName, "test-case.md"),
    testCaseJson: await readChangeFile(root, changeName, "test-case.json"),
    traceability: await readChangeFile(root, changeName, "traceability.json"),
  };
}
